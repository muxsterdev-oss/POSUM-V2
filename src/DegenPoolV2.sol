// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DegenPoolV2
 * @notice Minimal Degen pool for POSUM: accepts ETH deposits, sends 50% to Treasury,
 *         locks 50% for the user until unlock time. Hooks into SUMPoints and a
 *         (optional) RewardsDistributor for external reward accounting.
 *
 *         IMPORTANT: This contract DOES NOT hold large POSUM reward balances.
 *         Rewards should be funded from a RewardsDistributor held by the Treasury / DAO.
 */
contract DegenPoolV2 is Ownable, ReentrancyGuard {
    // --- Events ---
    event Deposited(address indexed user, uint256 ethAmount, uint256 lockedAmount, uint256 treasuryAmount);
    event PrincipalClaimed(address indexed user, uint256 amount);
    event TreasuryPaid(address indexed treasury, uint256 amount);
    event SetTreasury(address indexed treasury);
    event SetFoundersWeekParams(uint256 duration, uint256 capWei);
    event SetLaunchTimestamp(uint256 ts);
    event SetLockDuration(uint256 duration);
    event SetSumMultiplier(uint256 multiplier);
    event SetRewardsDistributor(address indexed distributor);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    // --- External contracts (interfaces kept minimal) ---
    interface ISumPoints {
        function awardPoints(address user, uint256 amount) external;
    }

    interface IRewardsDistributor {
        // optional hook; implementation up to you
        function notifyDeposit(address user, uint256 amountWei) external;
        function notifyWithdraw(address user, uint256 amountWei) external;
    }

    // --- State ---
    ISumPoints public immutable sumPoints;
    IRewardsDistributor public rewardsDistributor; // optional, can be zero
    address public treasury;

    uint256 public depositLockDuration = 90 days;
    uint256 public launchTimestamp;
    uint256 public foundersWeekDuration = 7 days;
    uint256 public foundersWeekCap = 1 ether; // cap per address during founders week

    // SUM multiplier: how many SUM points per 1 ETH (multiplier is in plain units)
    // e.g. sumMultiplier = 10 => 10 SUM points per 1 ETH
    uint256 public sumMultiplier = 10;

    // --- User accounting ---
    mapping(address => uint256) public userTotalDeposited;   // all-time deposited (for frontend)
    mapping(address => uint256) public userLockedAmount;      // amount currently locked (50% of deposits until unlock)
    mapping(address => uint256) public userUnlockTimestamp;   // when user can claim their locked principal

    // --- Constructor ---
    constructor(address initialOwner, address _sumPoints, address _treasury) Ownable(initialOwner) {
        require(_sumPoints != address(0), "SUMPoints required");
        require(_treasury != address(0), "treasury required");
        sumPoints = ISumPoints(_sumPoints);
        treasury = _treasury;
        launchTimestamp = block.timestamp;
    }

    // --- Mutative functions ---

    /**
     * @notice Deposit ETH into the Degen Pool.
     *         50% of msg.value is forwarded to the treasury immediately,
     *         50% is locked for the depositor until userUnlockTimestamp.
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "DegenPool: deposit=0");

        // founders week cap enforcement
        if (block.timestamp < launchTimestamp + foundersWeekDuration) {
            require(userTotalDeposited[msg.sender] + msg.value <= foundersWeekCap, "DegenPool: founders cap exceeded");
        }

        uint256 half = msg.value / 2;
        uint256 locked = msg.value - half; // ensures exact splitting in case of odd wei

        // send treasury portion
        (bool sent, ) = treasury.call{value: half}("");
        require(sent, "DegenPool: treasury transfer failed");
        emit TreasuryPaid(treasury, half);

        // record locked amount & unlock timestamp (extends lock from this deposit)
        userLockedAmount[msg.sender] += locked;
        // set unlock to current time + lockDuration (if multiple deposits, this will reset to newer timestamp)
        userUnlockTimestamp[msg.sender] = block.timestamp + depositLockDuration;

        userTotalDeposited[msg.sender] += msg.value;

        // Award SUM points via SUMPoints contract (simple model: multiplier * ETH)
        // Points = msg.value (wei) * sumMultiplier / 1e18  -> yields multiplier per ETH
        uint256 points = (msg.value * sumMultiplier) / 1e18;
        if (points > 0) {
            sumPoints.awardPoints(msg.sender, points);
        }

        // optional: notify rewards distributor (if set) for bookkeeping
        if (address(rewardsDistributor) != address(0)) {
            // best-effort notify; distributor should be trustworthy (owner set)
            rewardsDistributor.notifyDeposit(msg.sender, msg.value);
        }

        emit Deposited(msg.sender, msg.value, locked, half);
    }

    /**
     * @notice Claim locked principal after the lock duration has passed.
     */
    function claimPrincipal() external nonReentrant {
        uint256 unlockAt = userUnlockTimestamp[msg.sender];
        require(unlockAt > 0 && block.timestamp >= unlockAt, "DegenPool: lock not expired");
        uint256 amount = userLockedAmount[msg.sender];
        require(amount > 0, "DegenPool: nothing to claim");

        // zero out before transfer
        userLockedAmount[msg.sender] = 0;
        userUnlockTimestamp[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "DegenPool: transfer failed");

        // optional: notify rewards distributor about withdrawal
        if (address(rewardsDistributor) != address(0)) {
            rewardsDistributor.notifyWithdraw(msg.sender, amount);
        }

        emit PrincipalClaimed(msg.sender, amount);
    }

    // --- Admin / owner functions ---

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "zero address");
        treasury = _treasury;
        emit SetTreasury(_treasury);
    }

    function setFoundersWeekParams(uint256 _duration, uint256 _capWei) external onlyOwner {
        foundersWeekDuration = _duration;
        foundersWeekCap = _capWei;
        emit SetFoundersWeekParams(_duration, _capWei);
    }

    function setLaunchTimestamp(uint256 _ts) external onlyOwner {
        launchTimestamp = _ts;
        emit SetLaunchTimestamp(_ts);
    }

    function setLockDuration(uint256 _duration) external onlyOwner {
        depositLockDuration = _duration;
        emit SetLockDuration(_duration);
    }

    function setSumMultiplier(uint256 _multiplier) external onlyOwner {
        sumMultiplier = _multiplier;
        emit SetSumMultiplier(_multiplier);
    }

    function setRewardsDistributor(address _distributor) external onlyOwner {
        rewardsDistributor = IRewardsDistributor(_distributor);
        emit SetRewardsDistributor(_distributor);
    }

    // Emergency function for owner to recover accidentally-sent ETH (very careful with this)
    function emergencyWithdrawETH(address payable _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "zero address");
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "emergency withdraw failed");
        emit EmergencyWithdraw(_to, _amount);
    }

    // --- Views ---

    function lockedOf(address user) external view returns (uint256) {
        return userLockedAmount[user];
    }

    function unlockTimeOf(address user) external view returns (uint256) {
        return userUnlockTimestamp[user];
    }

    function totalDepositedOf(address user) external view returns (uint256) {
        return userTotalDeposited[user];
    }

    receive() external payable {
        revert("send via deposit()");
    }
}
