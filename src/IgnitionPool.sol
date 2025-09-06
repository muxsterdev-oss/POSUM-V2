// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // CORRECTED PATH
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./POSUM.sol";

/**
 * @title IgnitionPool
 * @author POSUM Protocol
 * @notice A staking pool for partner projects. Users stake POSUM to earn a partner's token.
 */
contract IgnitionPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for POSUM;

    POSUM public immutable posumToken;
    IERC20 public immutable rewardToken;

    uint256 public totalStaked;
    mapping(address => uint256) public userStaked;
    
    // Reward accounting
    uint256 public rewardPerShareStored;
    uint256 public lastUpdateTime;
    mapping(address => uint256) private userRewardDebt;
    mapping(address => uint256) public rewards;
    
    uint256 public rewardRate; // Amount of rewardToken per second
    uint256 public periodFinish; // Timestamp when rewards end

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount, uint duration);

    constructor(
        address _posumTokenAddress,
        address _rewardTokenAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        posumToken = POSUM(_posumTokenAddress);
        rewardToken = IERC20(_rewardTokenAddress);
    }

    /**
     * @notice Called by a partner project to fund the rewards for a staking period.
     * @param _rewardAmount The total amount of the reward token to distribute.
     * @param _duration The duration in seconds over which the rewards will be distributed.
     */
    function fundReward(uint256 _rewardAmount, uint _duration) external onlyOwner {
        require(_rewardAmount > 0, "Amount must be > 0");
        require(_duration > 0, "Duration must be > 0");
        
        // Ensure previous rewards are distributed before starting a new cycle
        if (block.timestamp < periodFinish) {
            uint256 remaining = (periodFinish - block.timestamp) * rewardRate;
            _rewardAmount += remaining;
        }

        rewardRate = _rewardAmount / _duration;
        periodFinish = block.timestamp + _duration;
        lastUpdateTime = block.timestamp;

        rewardToken.safeTransferFrom(msg.sender, address(this), _rewardAmount);
        emit RewardsFunded(msg.sender, _rewardAmount, _duration);
    }
    
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        _updateRewards(msg.sender);
        
        totalStaked += _amount;
        userStaked[msg.sender] += _amount;
        posumToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        emit Staked(msg.sender, _amount);
    }
    
    function withdraw(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot withdraw 0");
        _updateRewards(msg.sender);

        totalStaked -= _amount;
        userStaked[msg.sender] -= _amount;
        posumToken.safeTransfer(msg.sender, _amount);
        
        emit Withdrawn(msg.sender, _amount);
    }

    function claimReward() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }
    
    function _updateRewards(address _account) internal {
        rewardPerShareStored = getRewardPerShare();
        lastUpdateTime = block.timestamp;
        
        uint256 pending = (userStaked[_account] * rewardPerShareStored / 1e18) - userRewardDebt[_account];
        rewards[_account] += pending;
        userRewardDebt[_account] = userStaked[_account] * rewardPerShareStored / 1e18;
    }
    
    function getRewardPerShare() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerShareStored;
        }
        uint256 timePoint = block.timestamp < periodFinish ? block.timestamp : periodFinish;
        return rewardPerShareStored + ((timePoint - lastUpdateTime) * rewardRate * 1e18 / totalStaked);
    }

    function getPendingRewards(address _user) external view returns (uint256) {
        return (userStaked[_user] * getRewardPerShare() / 1e18) - userRewardDebt[_user] + rewards[_user];
    }
}