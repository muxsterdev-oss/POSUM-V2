// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IChainlink.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface ICompoundV3 {
    function supply(address asset, uint amount) external;
    function withdraw(address asset, uint amount) external;
    function claim(address asset, address src, address to, uint amount) external;
    function getRewardOwed(address account) external view returns (address, uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract PositivePoolVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    // --- STATE VARIABLES (Simplified for Flexible-Only) ---
    IERC20Metadata public immutable ASSET;
    ICompoundV3 public immutable COMPOUND_MARKET;
    AggregatorV3Interface internal immutable PRICE_FEED;
    IERC20Metadata public immutable REWARD_TOKEN;

    uint256 public totalShares;
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userSumPoints;
    
    // Reward accounting
    mapping(address => uint256) public rewards;
    uint256 private rewardPerShareStored;
    uint256 public lastUpdateTime;
    mapping(address => uint256) private userRewardDebt;
    uint256 private lastTotalExternalRewards;
    
    // Point accounting
    mapping(address => uint256) private userLastPointUpdateTime;
    
    // --- EVENTS ---
    event Deposited(address indexed user, uint256 amount, uint256 sharesIssued);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event YieldClaimed(address indexed user, uint256 amount);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    constructor(
        address initialOwner,
        address _assetAddress,
        address _compoundMarketAddress,
        address _rewardTokenAddress,
        address _priceFeedAddress
    ) Ownable(initialOwner) {
        require(_assetAddress != address(0) && _compoundMarketAddress != address(0) && _priceFeedAddress != address(0) && _rewardTokenAddress != address(0), "Invalid addresses");

        ASSET = IERC20Metadata(_assetAddress);
        COMPOUND_MARKET = ICompoundV3(_compoundMarketAddress);
        REWARD_TOKEN = IERC20Metadata(_rewardTokenAddress);
        PRICE_FEED = AggregatorV3Interface(_priceFeedAddress);
        lastUpdateTime = block.timestamp;

        ASSET.approve(address(COMPOUND_MARKET), type(uint256).max);
    }

    // --- MUTATIVE FUNCTIONS ---

    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount too small");
        
        if (userShares[msg.sender] > 0) {
            _updateRewards(msg.sender);
            _updatePoints(msg.sender);
        } else {
            userLastPointUpdateTime[msg.sender] = block.timestamp;
        }
        
        ASSET.safeTransferFrom(msg.sender, address(this), _amount);
        COMPOUND_MARKET.supply(address(ASSET), _amount);

        uint256 sharesToIssue = _amount; // 1:1 share issuance for simplicity in V1
        
        userShares[msg.sender] += sharesToIssue;
        totalShares += sharesToIssue;
        
        userRewardDebt[msg.sender] = getRewardPerShare() * userShares[msg.sender] / 1e18;
        emit Deposited(msg.sender, _amount, sharesToIssue);
    }
    
    function claimYield() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 claimable = rewards[msg.sender];
        require(claimable > 0, "No yield to claim");

        rewards[msg.sender] = 0;
        
        COMPOUND_MARKET.claim(address(REWARD_TOKEN), address(this), address(this), claimable);
        REWARD_TOKEN.safeTransfer(msg.sender, claimable);
        
        lastTotalExternalRewards = _getRewardOwedFromCompound();
        
        emit YieldClaimed(msg.sender, claimable);
    }

    function withdraw(uint256 _shares) external nonReentrant {
        require(_shares > 0, "Must withdraw > 0 shares");
        require(userShares[msg.sender] >= _shares, "Insufficient shares");
        
        _updateRewards(msg.sender);
        _updatePoints(msg.sender);
        
        userShares[msg.sender] -= _shares;
        totalShares -= _shares;

        uint256 amountToWithdraw = _shares;

        COMPOUND_MARKET.withdraw(address(ASSET), amountToWithdraw);
        ASSET.safeTransfer(msg.sender, amountToWithdraw);
        
        userRewardDebt[msg.sender] = getRewardPerShare() * userShares[msg.sender] / 1e18;
        emit Withdrawn(msg.sender, amountToWithdraw, _shares);
    }
    
    function rescueTokens(address _token, address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Zero address");
        require(_token != address(ASSET), "Cannot rescue pool asset");
        require(_token != address(REWARD_TOKEN), "Cannot rescue reward asset");
        IERC20Metadata(_token).safeTransfer(_to, _amount);
        emit TokenRescued(_token, _to, _amount);
    }
    
    // --- INTERNAL LOGIC ---

    function _updateRewards(address _user) private {
        uint256 totalRewards = _getRewardOwedFromCompound();
        
        if (totalRewards > lastTotalExternalRewards && totalShares > 0) {
            uint256 delta = totalRewards - lastTotalExternalRewards;
            rewardPerShareStored += (delta * 1e18) / totalShares;
        }
        lastTotalExternalRewards = totalRewards;

        if (userShares[_user] > 0) {
            uint256 pending = (rewardPerShareStored * userShares[_user] / 1e18) - userRewardDebt[_user];
            if (pending > 0) rewards[_user] += pending;
        }
        userRewardDebt[msg.sender] = rewardPerShareStored * userShares[_user] / 1e18;
        lastUpdateTime = block.timestamp;
    }

    function _updatePoints(address _user) private {
        if (userLastPointUpdateTime[_user] == 0) {
            userLastPointUpdateTime[_user] = block.timestamp;
            return;
        }
        
        if (userShares[_user] > 0) {
            uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
            if (timeElapsed > 365 days) timeElapsed = 365 days;

            uint256 usdValue = userShares[_user];
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

    // --- VIEW FUNCTIONS ---

    function getContractValue() public view returns (uint256) {
        return COMPOUND_MARKET.balanceOf(address(this)) + ASSET.balanceOf(address(this));
    }
    
    function claimableYield(address _user) public view returns (uint256) {
        return rewards[_user] + getPendingRewards(_user);
    }

    function getPendingRewards(address _user) public view returns (uint256) {
        if (userShares[_user] == 0) return 0;
        uint256 acc = getRewardPerShare();
        return (acc * userShares[_user] / 1e18) - userRewardDebt[_user];
    }
    
    function getRewardPerShare() public view returns (uint256) {
        if (totalShares == 0) { return rewardPerShareStored; }
        
        uint256 totalRewards = _getRewardOwedFromCompound();
        uint256 delta = totalRewards > lastTotalExternalRewards ? totalRewards - lastTotalExternalRewards : 0;
        
        return rewardPerShareStored + (delta * 1e18 / totalShares);
    }
    
    function getCurrentSumPoints(address _user) public view returns (uint256) {
        if (userLastPointUpdateTime[_user] == 0) return userSumPoints[_user];
        
        if (userShares[_user] == 0) return userSumPoints[_user];

        uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
        if (timeElapsed > 365 days) timeElapsed = 365 days;

        uint256 usdValue = userShares[_user];
        uint256 price = _getLatestPrice();
        uint256 normalizedValue = (usdValue * price) / (10 ** ASSET.decimals());

        uint256 unUpdatedPoints = (normalizedValue * timeElapsed);
        return userSumPoints[_user] + unUpdatedPoints;
    }

    function _getRewardOwedFromCompound() internal view returns (uint256) {
        (address rewardToken, uint256 amount) = COMPOUND_MARKET.getRewardOwed(address(this));
        require(rewardToken == address(REWARD_TOKEN), "Reward token mismatch");
        return amount;
    }
}

