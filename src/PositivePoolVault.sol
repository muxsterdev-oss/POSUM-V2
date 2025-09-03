// src/PositivePoolVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IChainlink.sol";

interface ICompoundV3 {
    function supply(address asset, uint amount) external;
    function withdraw(address asset, uint amount) external;
    function claim(address asset, address src, address to, uint amount) external;
    function getRewardOwed(address account) external view returns (address, uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract PositivePoolVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable ASSET;
    ICompoundV3 public immutable COMPOUND_V3_USDC;
    AggregatorV3Interface internal immutable PRICE_FEED;
    IERC20 public immutable REWARD_TOKEN;

    uint256 public totalFlexShares;
    uint256 public totalLockedShares;
    mapping(address => uint256) public userFlexShares;
    mapping(address => uint256) public userLockedShares;
    mapping(address => uint256) public userLockEndDate;
    mapping(address => uint256) public userSumPoints;
    
    mapping(address => uint256) public rewards;
    uint256 private rewardPerShareStored;
    uint256 public lastUpdateTime;
    mapping(address => uint256) private userRewardDebt;
    uint256 private lastTotalExternalRewards;
    
    mapping(address => uint256) private userLastPointUpdateTime;
    
    uint16 public immutable FLEX_MULTIPLIER_BPS;
    uint16 public immutable LOCKED_MULTIPLIER_BPS;
    uint256 public immutable LOCK_DURATION;

    event Deposited(address indexed user, uint256 amount, uint256 sharesIssued, bool isLocked);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event YieldClaimed(address indexed user, uint256 amount);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    constructor(
        address initialOwner,
        address _assetAddress,
        address _compoundMarketAddress,
        address _rewardTokenAddress,
        address _priceFeedAddress,
        uint16 _flexMultiplierBps,
        uint16 _lockedMultiplierBps,
        uint256 _lockDurationSeconds
    ) Ownable(initialOwner) {
        require(_assetAddress != address(0) && _compoundMarketAddress != address(0) && _priceFeedAddress != address(0) && _rewardTokenAddress != address(0), "Invalid addresses");
        require(_flexMultiplierBps > 0 && _lockedMultiplierBps > 0, "Multipliers must be > 0");

        ASSET = IERC20(_assetAddress);
        COMPOUND_V3_USDC = ICompoundV3(_compoundMarketAddress);
        REWARD_TOKEN = IERC20(_rewardTokenAddress);
        PRICE_FEED = AggregatorV3Interface(_priceFeedAddress);
        FLEX_MULTIPLIER_BPS = _flexMultiplierBps;
        LOCKED_MULTIPLIER_BPS = _lockedMultiplierBps;
        LOCK_DURATION = _lockDurationSeconds;
        lastUpdateTime = block.timestamp;

        // --- CORRECTED THIS LINE ---
        // Set a one-time, maximum allowance for the Compound protocol
        ASSET.approve(address(COMPOUND_V3_USDC), type(uint256).max);
    }

    function deposit(uint256 _amount, bool _isLocked) external nonReentrant {
        require(_amount > 0, "Amount too small");
        
        _updateRewards(msg.sender);
        _updatePoints(msg.sender);
        
        ASSET.safeTransferFrom(msg.sender, address(this), _amount);
        COMPOUND_V3_USDC.supply(address(ASSET), _amount);

        uint256 multiplier = _isLocked ? LOCKED_MULTIPLIER_BPS : FLEX_MULTIPLIER_BPS;
        uint256 sharesToIssue = (_amount * multiplier) / 10000;
        
        if (_isLocked) {
            require(userLockedShares[msg.sender] == 0, "Locked position already exists");
            userLockedShares[msg.sender] += sharesToIssue;
            totalLockedShares += sharesToIssue;
            userLockEndDate[msg.sender] = block.timestamp + LOCK_DURATION;
        } else {
            userFlexShares[msg.sender] += sharesToIssue;
            totalFlexShares += sharesToIssue;
        }
        
        userRewardDebt[msg.sender] = getRewardPerShare() * (userFlexShares[msg.sender] + userLockedShares[msg.sender]) / 1e18;
        emit Deposited(msg.sender, _amount, sharesToIssue, _isLocked);
    }
    
    function claimYield() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 claimable = rewards[msg.sender];
        require(claimable > 0, "No yield to claim");

        rewards[msg.sender] = 0;
        
        COMPOUND_V3_USDC.claim(address(REWARD_TOKEN), address(this), address(this), claimable);
        REWARD_TOKEN.safeTransfer(msg.sender, claimable);
        
        lastTotalExternalRewards = _getRewardOwedFromCompound();
        
        emit YieldClaimed(msg.sender, claimable);
    }

    function withdraw(uint256 _shares) external nonReentrant {
        require(_shares > 0, "Must withdraw > 0 shares");
        require(userFlexShares[msg.sender] >= _shares, "Insufficient flexible shares");
        
        _updateRewards(msg.sender);
        _updatePoints(msg.sender);
        
        userFlexShares[msg.sender] -= _shares;
        totalFlexShares -= _shares;

        uint256 amountToWithdraw = previewWithdrawFlex(_shares);

        COMPOUND_V3_USDC.withdraw(address(ASSET), amountToWithdraw);
        ASSET.safeTransfer(msg.sender, amountToWithdraw);
        
        userRewardDebt[msg.sender] = getRewardPerShare() * (userFlexShares[msg.sender] + userLockedShares[msg.sender]) / 1e18;
        emit Withdrawn(msg.sender, amountToWithdraw, _shares);
    }
    
    function withdrawLocked() external nonReentrant {
        require(block.timestamp >= userLockEndDate[msg.sender], "Lock period not expired");
        uint256 sharesToWithdraw = userLockedShares[msg.sender];
        require(sharesToWithdraw > 0, "No locked shares to withdraw");

        _updateRewards(msg.sender);
        _updatePoints(msg.sender);

        userLockedShares[msg.sender] = 0;
        totalLockedShares -= sharesToWithdraw;
        userLockEndDate[msg.sender] = 0;

        uint256 amountToWithdraw = previewWithdrawLocked(sharesToWithdraw);

        COMPOUND_V3_USDC.withdraw(address(ASSET), amountToWithdraw);
        ASSET.safeTransfer(msg.sender, amountToWithdraw);

        userRewardDebt[msg.sender] = getRewardPerShare() * (userFlexShares[msg.sender] + userLockedShares[msg.sender]) / 1e18;
        emit Withdrawn(msg.sender, amountToWithdraw, sharesToWithdraw);
    }
    
    function rescueTokens(address _token, address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Zero address");
        require(_token != address(ASSET), "Cannot rescue pool asset");
        require(_token != address(REWARD_TOKEN), "Cannot rescue reward asset");
        IERC20(_token).safeTransfer(_to, _amount);
        emit TokenRescued(_token, _to, _amount);
    }
    
    function _updateRewards(address _user) private {
        uint256 totalShares = totalFlexShares + totalLockedShares;
        uint256 totalRewards = _getRewardOwedFromCompound();
        
        if (totalRewards > lastTotalExternalRewards && totalShares > 0) {
            uint256 delta = totalRewards - lastTotalExternalRewards;
            rewardPerShareStored += (delta * 1e18) / totalShares;
        }
        lastTotalExternalRewards = totalRewards;

        uint256 userTotalShares = userFlexShares[_user] + userLockedShares[_user];
        if (userTotalShares > 0) {
            uint256 pending = (rewardPerShareStored * userTotalShares / 1e18) - userRewardDebt[_user];
            if (pending > 0) rewards[_user] += pending;
        }
        userRewardDebt[_user] = rewardPerShareStored * userTotalShares / 1e18;
        lastUpdateTime = block.timestamp;
    }

    function _updatePoints(address _user) private {
        if (userLastPointUpdateTime[_user] == 0) {
            userLastPointUpdateTime[_user] = block.timestamp;
            return;
        }
        
        uint256 userTotalShares = userFlexShares[_user] + userLockedShares[_user];
        if (userTotalShares > 0) {
            uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
            if (timeElapsed > 365 days) timeElapsed = 365 days;

            uint256 usdValue = previewWithdrawFlex(userFlexShares[_user]) + previewWithdrawLocked(userLockedShares[_user]);
            uint256 price = _getLatestPrice();
            uint256 normalizedValue = (usdValue * price) / (10 ** ASSET.decimals());

            uint256 newPoints = (normalizedValue * timeElapsed);
            userSumPoints[_user] += newPoints;
        }
        userLastPointUpdateTime[_user] = block.timestamp;
    }
    
    function _getLatestPrice() internal view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = PRICE_FEED.latestRoundData();
        require(price > 0, "PositivePool: Invalid price");
        require(block.timestamp - updatedAt < 1 hours, "PositivePool: Stale price");
        
        uint8 decimals = PRICE_FEED.decimals();
        if (decimals == 18) return uint256(price);
        if (decimals < 18) return uint256(price) * (10 ** (18 - decimals));
        return uint256(price) / (10 ** (decimals - 18));
    }

    function getContractValue() public view returns (uint256) {
        return COMPOUND_V3_USDC.balanceOf(address(this)) + ASSET.balanceOf(address(this));
    }
    
    function claimableYield(address _user) public view returns (uint256) {
        return rewards[_user] + getPendingRewards(_user);
    }

    function getPendingRewards(address _user) public view returns (uint256) {
        uint256 userTotalShares = userFlexShares[_user] + userLockedShares[_user];
        if (userTotalShares == 0) return 0;
        uint256 acc = getRewardPerShare();
        return (acc * userTotalShares / 1e18) - userRewardDebt[_user];
    }
    
    function getRewardPerShare() public view returns (uint256) {
        uint256 totalShares = totalFlexShares + totalLockedShares;
        if (totalShares == 0) { return rewardPerShareStored; }
        
        uint256 totalRewards = _getRewardOwedFromCompound();
        uint256 delta = totalRewards > lastTotalExternalRewards ? totalRewards - lastTotalExternalRewards : 0;
        
        return rewardPerShareStored + (delta * 1e18 / totalShares);
    }

    function previewWithdrawFlex(uint256 _shares) public view returns (uint256) {
        return (_shares * 10000) / FLEX_MULTIPLIER_BPS;
    }

    function previewWithdrawLocked(uint256 _shares) public view returns (uint256) {
        return (_shares * 10000) / LOCKED_MULTIPLIER_BPS;
    }
    
    function getCurrentSumPoints(address _user) public view returns (uint256) {
        if (userLastPointUpdateTime[_user] == 0) return userSumPoints[_user];
        
        uint256 userTotalShares = userFlexShares[_user] + userLockedShares[_user];
        if (userTotalShares == 0) return userSumPoints[_user];

        uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
        if (timeElapsed > 365 days) timeElapsed = 365 days;

        uint256 usdValue = previewWithdrawFlex(userFlexShares[_user]) + previewWithdrawLocked(userLockedShares[_user]);
        uint256 price = _getLatestPrice();
        uint256 normalizedValue = (usdValue * price) / (10 ** ASSET.decimals());

        uint256 unUpdatedPoints = (normalizedValue * timeElapsed);
        return userSumPoints[_user] + unUpdatedPoints;
    }

    function _getRewardOwedFromCompound() internal view returns (uint256) {
        (address rewardToken, uint256 amount) = COMPOUND_V3_USDC.getRewardOwed(address(this));
        require(rewardToken == address(REWARD_TOKEN), "Reward token mismatch");
        return amount;
    }
}