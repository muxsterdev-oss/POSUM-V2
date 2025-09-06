// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./POSUM.sol";

/**
 * @title RewardsDistributor
 * @author POSUM Protocol
 * @notice A contract to manage the linear release of community rewards over time.
 */
contract RewardsDistributor is Ownable {
    using SafeERC20 for POSUM;

    POSUM public immutable posumToken;

    struct RewardSchedule {
        address destination;      // The pool contract receiving the rewards
        uint256 totalAmount;        // Total amount for this schedule
        uint256 releasedAmount;     // Amount already released
        uint64 startTimestamp;      // When the schedule begins
        uint64 durationSeconds;     // Total duration of the schedule
    }

    mapping(string => RewardSchedule) public rewardSchedules;
    string[] public scheduleNames;

    event RewardScheduleCreated(string indexed name, address indexed destination, uint256 totalAmount, uint64 duration);
    event RewardsReleased(string indexed name, uint256 amount);

    constructor(address _posumTokenAddress, address initialOwner) Ownable(initialOwner) {
        require(_posumTokenAddress != address(0), "Token address cannot be zero");
        posumToken = POSUM(_posumTokenAddress);
    }

    /**
     * @notice Creates a new linear vesting schedule for a rewards pool.
     * @param _name A unique name for the schedule (e.g., "DEGEN_POOL_SEASON_1").
     * @param _destination The address of the pool contract that can claim these rewards.
     * @param _totalAmount The total amount of POSUM to be distributed.
     * @param _durationSeconds The total duration of the reward period.
     */
    function createRewardSchedule(
        string memory _name,
        address _destination,
        uint256 _totalAmount,
        uint64 _durationSeconds
    ) external onlyOwner {
        require(rewardSchedules[_name].startTimestamp == 0, "Schedule with this name already exists");
        require(_destination != address(0), "Destination cannot be zero");
        require(_totalAmount > 0, "Amount must be > 0");
        require(_durationSeconds > 0, "Duration must be > 0");

        rewardSchedules[_name] = RewardSchedule({
            destination: _destination,
            totalAmount: _totalAmount,
            releasedAmount: 0,
            startTimestamp: uint64(block.timestamp),
            durationSeconds: _durationSeconds
        });
        scheduleNames.push(_name);
        emit RewardScheduleCreated(_name, _destination, _totalAmount, _durationSeconds);
    }

    /**
     * @notice Allows a destination contract (e.g., DegenPool) to pull its available rewards.
     * @param _name The name of the schedule to claim from.
     */
    function releaseRewards(string memory _name) external {
        RewardSchedule storage schedule = rewardSchedules[_name];
        require(msg.sender == schedule.destination, "Caller is not the destination for this schedule");

        uint256 releasableAmount = getReleasableAmount(_name);
        require(releasableAmount > 0, "No rewards available to release");

        schedule.releasedAmount += releasableAmount;

        posumToken.safeTransfer(msg.sender, releasableAmount);
        emit RewardsReleased(_name, releasableAmount);
    }

    /**
     * @notice Calculates the amount of rewards available to be released for a given schedule.
     * @param _name The name of the schedule.
     * @return The amount of releasable POSUM tokens.
     */
    function getReleasableAmount(string memory _name) public view returns (uint256) {
        RewardSchedule storage schedule = rewardSchedules[_name];
        if (schedule.startTimestamp == 0) {
            return 0;
        }

        uint256 vestedAmount = _getVestedAmount(_name);
        return vestedAmount - schedule.releasedAmount;
    }

    function _getVestedAmount(string memory _name) internal view returns (uint256) {
        RewardSchedule storage schedule = rewardSchedules[_name];

        if (block.timestamp < schedule.startTimestamp) {
            return 0;
        }

        uint256 timeSinceStart = block.timestamp - schedule.startTimestamp;
        if (timeSinceStart >= schedule.durationSeconds) {
            return schedule.totalAmount;
        }

        return (schedule.totalAmount * timeSinceStart) / schedule.durationSeconds;
    }
}

