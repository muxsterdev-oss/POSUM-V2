// src/DegenPoolV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IChainlink.sol"; // --- CORRECTED IMPORT PATH ---

contract DegenPoolV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public totalDeposited;
    uint256 public totalShares;
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userSumPoints;
    mapping(address => uint256) public rewards;
    
    uint256 public immutable ANNUAL_PERCENTAGE_RATE_BPS;
    
    uint256 private constant SECONDS_PER_YEAR = 31536000;
    uint256 public immutable YIELD_PER_SECOND_PER_SHARE;
    mapping(address => uint256) private userRewardDebt;
    uint256 public lastUpdateTime;
    uint256 private rewardPerShareStored;
    mapping(address => uint256) private userLastPointUpdateTime;
    address public treasuryWallet;
    uint256 public constant TREASURY_FEE_BPS = 500;

    uint256 public rewardPool;

    AggregatorV3Interface internal priceFeed;

    event Deposited(address indexed user, uint256 amount, uint256 sharesIssued);
    event Claimed(address indexed user, uint256 userAmount, uint256 feeAmount);
    event TreasuryWalletUpdated(address newTreasuryWallet);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount);

    constructor(
        address initialOwner, 
        address initialTreasury,
        address _priceFeedAddress,
        uint256 _aprBps
    ) Ownable(initialOwner) {
        require(initialTreasury != address(0), "Treasury cannot be zero");
        require(_priceFeedAddress != address(0), "Price feed cannot be zero");
        treasuryWallet = initialTreasury;
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        ANNUAL_PERCENTAGE_RATE_BPS = _aprBps;
        lastUpdateTime = block.timestamp;
        YIELD_PER_SECOND_PER_SHARE = (1e18 * ANNUAL_PERCENTAGE_RATE_BPS) / 10000 / SECONDS_PER_YEAR;
    }

    function fundRewards() external payable onlyOwner nonReentrant {
        require(msg.value > 0, "Must send funds");
        rewardPool += msg.value;
        emit RewardsFunded(msg.sender, msg.value);
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit must be > 0");

        _updateRewards(msg.sender);
        _updatePoints(msg.sender);
        
        uint256 sharesToIssue = msg.value;
        totalDeposited += sharesToIssue;
        totalShares += sharesToIssue;
        userShares[msg.sender] += sharesToIssue;
        
        userRewardDebt[msg.sender] = getRewardPerShare() * userShares[msg.sender] / 1e18;

        emit Deposited(msg.sender, msg.value, sharesToIssue);
    }

    function claim() external nonReentrant {
        _updateRewards(msg.sender);
        _updatePoints(msg.sender);
        
        uint256 claimable = rewards[msg.sender];
        require(claimable > 0, "No rewards to claim");
        require(rewardPool >= claimable, "DegenPool: Insufficient reward pool");
        
        rewardPool -= claimable;
        rewards[msg.sender] = 0;
        
        uint256 feeAmount = (claimable * TREASURY_FEE_BPS) / 10000;
        uint256 userAmount = claimable - feeAmount;
        
        (bool feeSuccess, ) = treasuryWallet.call{value: feeAmount}("");
        require(feeSuccess, "Treasury transfer failed");
        
        (bool userSuccess, ) = msg.sender.call{value: userAmount}("");
        require(userSuccess, "User transfer failed");
        
        emit Claimed(msg.sender, userAmount, feeAmount);
    }
    
    function _updatePoints(address _user) private {
        if (userLastPointUpdateTime[_user] == 0) {
            userLastPointUpdateTime[_user] = block.timestamp;
            return;
        }

        uint256 _userShares = userShares[_user];
        if (_userShares > 0) {
            uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
            if (timeElapsed > 365 days) {
                timeElapsed = 365 days;
            }
            
            uint256 ethPrice18 = _getLatestPrice(); 
            uint256 usdValue = (_userShares * ethPrice18) / 1e18; 
            
            uint256 newPoints = (usdValue * timeElapsed * 2);
            userSumPoints[_user] += newPoints;
        }
        userLastPointUpdateTime[_user] = block.timestamp;
    }

    function _updateRewards(address _user) private {
        rewardPerShareStored = getRewardPerShare();
        lastUpdateTime = block.timestamp;

        uint256 _userShares = userShares[_user];
        if (_userShares > 0) {
            uint256 pending = (rewardPerShareStored * _userShares / 1e18) - userRewardDebt[_user];
            rewards[_user] += pending;
        }
        userRewardDebt[_user] = rewardPerShareStored * _userShares / 1e18;
    }
    
    function _getLatestPrice() internal view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "DegenPool: Invalid price from oracle");
        require(block.timestamp - updatedAt < 1 hours, "DegenPool: Stale price from oracle");
        
        uint8 decimals = priceFeed.decimals();
        if (decimals == 18) {
            return uint256(price);
        } else if (decimals < 18) {
            return uint256(price) * (10 ** (18 - decimals));
        } else {
            return uint256(price) / (10 ** (decimals - 18));
        }
    }
    
    function getTotalClaimable(address _user) public view returns (uint256) {
        return rewards[_user] + getPendingRewards(_user);
    }

    function getPendingRewards(address _user) public view returns (uint256) {
        uint256 _userShares = userShares[_user];
        if (_userShares == 0) { return 0; }
        uint256 acc = getRewardPerShare();
        return (acc * _userShares / 1e18) - userRewardDebt[_user];
    }
    
    function getRewardPerShare() public view returns (uint256) {
        if (totalShares == 0) { return rewardPerShareStored; }
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        return rewardPerShareStored + (timeElapsed * YIELD_PER_SECOND_PER_SHARE);
    }

    function getCurrentSumPoints(address _user) public view returns (uint256) {
        if (userLastPointUpdateTime[_user] == 0) return userSumPoints[_user];

        uint256 _userShares = userShares[_user];
        if (_userShares == 0) return userSumPoints[_user];

        uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
        if (timeElapsed > 365 days) timeElapsed = 365 days;
        
        uint256 ethPrice18 = _getLatestPrice();
        uint256 usdValue = (_userShares * ethPrice18) / 1e18;
        
        uint256 unUpdatedPoints = (usdValue * timeElapsed * 2);
        return userSumPoints[_user] + unUpdatedPoints;
    }

    function setTreasuryWallet(address _newTreasuryWallet) external onlyOwner {
        require(_newTreasuryWallet != address(0), "Cannot be zero");
        treasuryWallet = _newTreasuryWallet;
        emit TreasuryWalletUpdated(_newTreasuryWallet);
    }
    
    function rescueTokens(address _tokenAddress, address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Cannot send to zero address");
        IERC20(_tokenAddress).safeTransfer(_to, _amount);
        emit TokenRescued(_tokenAddress, _to, _amount);
    }
}