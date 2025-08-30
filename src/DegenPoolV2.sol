// src/DegenPoolV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// --- 1. ADDED CHAINLINK INTERFACE ---
interface AggregatorV3Interface {
  function decimals() external view returns (uint8);
  function description() external view returns (string memory);
  function version() external view returns (uint256);
  function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
  function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract DegenPoolV2 is Ownable, ReentrancyGuard {
    uint256 public totalDeposited;
    uint256 public totalShares;
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public userSumPoints;
    mapping(address => uint256) public rewards;
    uint256 public constant ANNUAL_PERCENTAGE_RATE_BPS = 10000; // 100% APY
    uint256 private constant SECONDS_PER_YEAR = 31536000;
    uint256 public immutable YIELD_PER_SECOND_PER_SHARE;
    mapping(address => uint256) private userRewardDebt;
    uint256 public lastUpdateTime;
    uint256 private rewardPerShareStored;
    mapping(address => uint256) private userLastPointUpdateTime;
    address public treasuryWallet;
    uint256 public constant TREASURY_FEE_BPS = 500; // 5%

    // --- 2. ADDED CHAINLINK PRICE FEED ADDRESS ---
    AggregatorV3Interface internal priceFeed;

    event Deposited(address indexed user, uint256 amount, uint256 sharesIssued);
    event Claimed(address indexed user, uint256 userAmount, uint256 feeAmount);
    event TreasuryWalletUpdated(address newTreasuryWallet);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    // --- 3. UPDATED CONSTRUCTOR ---
    constructor(
        address initialOwner, 
        address initialTreasury,
        address _priceFeedAddress
    ) Ownable(initialOwner) {
        require(initialTreasury != address(0), "Treasury cannot be zero");
        require(_priceFeedAddress != address(0), "Price feed cannot be zero");
        treasuryWallet = initialTreasury;
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        lastUpdateTime = block.timestamp;
        YIELD_PER_SECOND_PER_SHARE = (1e18 * ANNUAL_PERCENTAGE_RATE_BPS) / 10000 / SECONDS_PER_YEAR;
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit must be > 0");

        _updateRewards();
        _updatePoints(msg.sender);

        uint256 acc = rewardPerShareStored;
        uint256 _userShares = userShares[msg.sender];
        uint256 pending = (acc * _userShares / 1e18) - userRewardDebt[msg.sender];
        if (pending > 0) {
            rewards[msg.sender] += pending;
        }
        
        userRewardDebt[msg.sender] = acc * _userShares / 1e18;

        uint256 sharesToIssue = msg.value;
        totalDeposited += sharesToIssue;
        totalShares += sharesToIssue;
        userShares[msg.sender] += sharesToIssue;

        userRewardDebt[msg.sender] += (acc * sharesToIssue / 1e18);

        emit Deposited(msg.sender, msg.value, sharesToIssue);
    }

    function claim() external nonReentrant {
        _updateRewards();
        _updatePoints(msg.sender);
        uint256 acc = rewardPerShareStored;
        uint256 _userShares = userShares[msg.sender];
        uint256 pending = (acc * _userShares / 1e18) - userRewardDebt[msg.sender];
        if (pending > 0) {
            rewards[msg.sender] += pending;
        }
        userRewardDebt[msg.sender] = acc * _userShares / 1e18;
        uint256 claimable = rewards[msg.sender];
        require(claimable > 0, "No rewards to claim");
        uint256 feeAmount = (claimable * TREASURY_FEE_BPS) / 10000;
        uint256 userAmount = claimable - feeAmount;
        rewards[msg.sender] = 0;
        (bool feeSuccess, ) = treasuryWallet.call{value: feeAmount}("");
        require(feeSuccess, "Treasury transfer failed");
        (bool userSuccess, ) = msg.sender.call{value: userAmount}("");
        require(userSuccess, "User transfer failed");
        emit Claimed(msg.sender, userAmount, feeAmount);
    }

    function setTreasuryWallet(address _newTreasuryWallet) external onlyOwner {
        require(_newTreasuryWallet != address(0), "Cannot be zero");
        treasuryWallet = _newTreasuryWallet;
        emit TreasuryWalletUpdated(_newTreasuryWallet);
    }
    
    function rescueTokens(address _tokenAddress, address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Cannot send to zero address");
        IERC20 token = IERC20(_tokenAddress);
        token.transfer(_to, _amount);
        emit TokenRescued(_tokenAddress, _to, _amount);
    }
    
    // --- 4. UPDATED POINTS LOGIC ---
    function _updatePoints(address _user) private {
        uint256 _userShares = userShares[_user];
        if (_userShares > 0) {
            uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
            
            (, int price, , , ) = priceFeed.latestRoundData();
            uint256 ethPrice = uint256(price); // Price has 8 decimals
            
            // Convert shares (ETH in wei) to USD value with 18 decimals for precision
            uint256 usdValue = (_userShares * ethPrice) / 1e8; 
            
            // 2x multiplier for Degen Pool
            uint256 newPoints = (usdValue * timeElapsed * 2);
            userSumPoints[_user] += newPoints;
        }
        userLastPointUpdateTime[_user] = block.timestamp;
    }

    function _updateRewards() private {
        if (totalShares > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdateTime;
            rewardPerShareStored += (timeElapsed * YIELD_PER_SECOND_PER_SHARE);
        }
        lastUpdateTime = block.timestamp;
    }

    function getTotalClaimable(address _user) public view returns (uint256) {
        return rewards[_user] + getPendingRewards(_user);
    }

    function getPendingRewards(address _user) public view returns (uint256) {
        uint256 _userShares = userShares[_user];
        if (_userShares == 0) { return 0; }
        uint256 totalEarned = getRewardPerShare() * _userShares / 1e18;
        return totalEarned - userRewardDebt[_user];
    }
    
    function getRewardPerShare() public view returns (uint256) {
        if (totalShares == 0) { return rewardPerShareStored; }
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        return rewardPerShareStored + (timeElapsed * YIELD_PER_SECOND_PER_SHARE);
    }

    // --- 5. UPDATED POINTS VIEW FUNCTION ---
    function getCurrentSumPoints(address _user) public view returns (uint256) {
        uint256 _userShares = userShares[_user];
        if (_userShares == 0) { return userSumPoints[_user]; }

        uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
        
        (, int price, , , ) = priceFeed.latestRoundData();
        uint256 ethPrice = uint256(price);

        uint256 usdValue = (_userShares * ethPrice) / 1e8;
        
        uint256 unUpdatedPoints = (usdValue * timeElapsed * 2);
        return userSumPoints[_user] + unUpdatedPoints;
    }
}