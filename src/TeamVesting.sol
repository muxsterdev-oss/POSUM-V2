// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./POSUM.sol";

/**
 * @title TeamVesting
 * @author POSUM Protocol
 * @notice A vesting contract for the POSUM team and advisor token allocations.
 * It enforces a 6-month cliff and a 2-year linear vesting period thereafter.
 */
contract TeamVesting is Ownable {
    using SafeERC20 for POSUM;

    POSUM public immutable posumToken;

    struct VestingSchedule {
        uint256 totalAmount;   // Total amount to be vested
        uint256 releasedAmount; // Amount already released
        uint64 cliffTimestamp;   // Timestamp after which vesting begins (6 months)
        uint64 startTimestamp;   // The start of the vesting period (same as cliff)
        uint64 durationSeconds;  // The duration of the vesting period (2 years)
    }

    mapping(address => VestingSchedule) public vestingSchedules;
    address[] public beneficiaries;

    event VestingScheduleCreated(address indexed beneficiary, uint256 amount);
    event TokensReleased(address indexed beneficiary, uint256 amount);

    uint256 public constant SIX_MONTHS = 182 days;
    uint256 public constant TWO_YEARS = 730 days;

    constructor(address _posumTokenAddress, address initialOwner) Ownable(initialOwner) {
        require(_posumTokenAddress != address(0), "Token address cannot be zero");
        posumToken = POSUM(_posumTokenAddress);
    }

    /**
     * @notice Creates a new vesting schedule for a beneficiary. Can only be called by the owner.
     * @param _beneficiary The address of the team member or advisor.
     * @param _totalAmount The total amount of POSUM tokens to be vested.
     */
    function createVestingSchedule(address _beneficiary, uint256 _totalAmount) external onlyOwner {
        require(_beneficiary != address(0), "Beneficiary cannot be zero address");
        require(_totalAmount > 0, "Amount must be greater than zero");
        require(vestingSchedules[_beneficiary].totalAmount == 0, "Schedule already exists for this beneficiary");

        uint64 cliff = uint64(block.timestamp + SIX_MONTHS);
        uint64 duration = uint64(TWO_YEARS);

        vestingSchedules[_beneficiary] = VestingSchedule({
            totalAmount: _totalAmount,
            releasedAmount: 0,
            cliffTimestamp: cliff,
            startTimestamp: cliff, // Vesting starts after the cliff
            durationSeconds: duration
        });

        beneficiaries.push(_beneficiary);
        emit VestingScheduleCreated(_beneficiary, _totalAmount);
    }

    /**
     * @notice Allows a beneficiary to release their vested tokens.
     */
    function release() external {
        uint256 releasableAmount = getReleasableAmount(msg.sender);
        require(releasableAmount > 0, "No tokens available for release");

        vestingSchedules[msg.sender].releasedAmount += releasableAmount;

        posumToken.safeTransfer(msg.sender, releasableAmount);
        emit TokensReleased(msg.sender, releasableAmount);
    }

    /**
     * @notice Calculates the amount of tokens that have vested but not yet been released.
     * @param _beneficiary The address of the beneficiary.
     * @return The amount of releasable tokens.
     */
    function getReleasableAmount(address _beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        if (schedule.totalAmount == 0) {
            return 0;
        }

        uint256 vestedAmount = _getVestedAmount(_beneficiary);
        return vestedAmount - schedule.releasedAmount;
    }

    /**
     * @notice Calculates the total amount of tokens that have vested so far.
     * @param _beneficiary The address of the beneficiary.
     * @return The total vested amount.
     */
    function _getVestedAmount(address _beneficiary) internal view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        
        if (block.timestamp < schedule.cliffTimestamp) {
            return 0;
        }

        uint256 timeSinceStart = block.timestamp - schedule.startTimestamp;
        if (timeSinceStart >= schedule.durationSeconds) {
            return schedule.totalAmount;
        }

        return (schedule.totalAmount * timeSinceStart) / schedule.durationSeconds;
    }
    
    function getBeneficiaryCount() external view returns (uint256) {
        return beneficiaries.length;
    }
}

