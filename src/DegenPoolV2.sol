// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    uint256 public constant TREASURY_FEE_BPS = 500;
    event Deposited(address indexed user, uint256 amount, uint256 sharesIssued);
    event Claimed(address indexed user, uint256 userAmount, uint256 feeAmount);
    event TreasuryWalletUpdated(address newTreasuryWallet);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner, address initialTreasury) Ownable(initialOwner) {
        require(initialTreasury != address(0), "Treasury cannot be zero");
        treasuryWallet = initialTreasury;
        lastUpdateTime = block.timestamp;
        YIELD_PER_SECOND_PER_SHARE = (1e18 * ANNUAL_PERCENTAGE_RATE_BPS) / 10000 / SECONDS_PER_YEAR;
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit must be > 0");

        // Use the same robust update logic as in the claim function
        _updateRewards();
        _updatePoints(msg.sender);

        uint256 acc = rewardPerShareStored;
        uint256 _userShares = userShares[msg.sender];
        uint256 pending = (acc * _userShares / 1e18) - userRewardDebt[msg.sender];
        if (pending > 0) {
            rewards[msg.sender] += pending;
        }
        
        // This is the crucial update that syncs the debt before adding new shares
        userRewardDebt[msg.sender] = acc * _userShares / 1e18;

        // Now, add the new shares
        uint256 sharesToIssue = msg.value;
        totalDeposited += sharesToIssue;
        totalShares += sharesToIssue;
        userShares[msg.sender] += sharesToIssue;

        // And update the debt again for the newly added shares
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
    
    function _updatePoints(address _user) private {
        uint256 _userShares = userShares[_user];
        if (_userShares > 0) {
            uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
            uint256 newPoints = _userShares * timeElapsed;
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

    function getCurrentSumPoints(address _user) public view returns (uint256) {
        uint256 _userShares = userShares[_user];
        if (_userShares == 0) { return userSumPoints[_user]; }
        uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
        uint256 unUpdatedPoints = _userShares * timeElapsed;
        return userSumPoints[_user] + unUpdatedPoints;
    }
}