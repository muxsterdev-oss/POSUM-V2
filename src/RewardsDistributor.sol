// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RewardsDistributor
 * @notice Holds POSUM rewards and distributes them to authorized pools/users.
 * - Owner funds the contract by transferring POSUM to this contract.
 * - Authorized pools may call `notifySharesUpdate` to update user shares bookkeeping.
 * - Users can call `harvest` to claim accumulated POSUM.
 *
 * Simple accumulator-per-share model (accPosumPerShare uses 1e12 precision).
 */
contract RewardsDistributor is Ownable {
    IERC20 public immutable posum;

    // precision
    uint256 private constant PREC = 1e12;

    // authorized pools
    mapping(address => bool) public isPool;

    // accounting
    uint256 public accPosumPerShare; // accumulated POSUM per share (PREC)
    uint256 public totalShares;      // total shares across pools that we track

    // per-user state
    mapping(address => uint256) public userShares; // user -> shares (aggregated across pools)
    mapping(address => int256)  public userDebt;   // user -> debt (accrued)

    event Funded(address indexed from, uint256 amount);
    event PoolAuthorized(address indexed pool, bool active);
    event SharesUpdated(address indexed user, uint256 newUserShares, uint256 newTotalShares);
    event Harvested(address indexed user, uint256 amount);

    constructor(address _posum, address _owner) Ownable() {
        require(_posum != address(0), "posum=0");
        posum = IERC20(_posum);
        transferOwnership(_owner);
    }

    modifier onlyPool() {
        require(isPool[msg.sender], "not authorized pool");
        _;
    }

    /// @notice Owner can mark a pool as authorized to call notifySharesUpdate
    function setPool(address pool, bool active) external onlyOwner {
        isPool[pool] = active;
        emit PoolAuthorized(pool, active);
    }

    /// @notice Fund the distributor with POSUM. Owner should transfer POSUM before calling fund or call approve+transferFrom
    function fund(uint256 amount) external onlyOwner {
        require(amount > 0, "amount=0");
        require(posum.transferFrom(msg.sender, address(this), amount), "transfer failed");
        // immediately available for distribution; if totalShares>0, increase accPerShare
        if (totalShares > 0) {
            accPosumPerShare += (amount * PREC) / totalShares;
        }
        emit Funded(msg.sender, amount);
    }

    /// @notice Pools call this when a user's share changes. Only callable by authorized pools.
    /// @param user user address
    /// @param newUserShares new aggregated share value for the user (pool must compute and pass)
    /// @param harvestBefore if true, harvest pending rewards for user before changing shares
    function notifySharesUpdate(address user, uint256 newUserShares, bool harvestBefore) external onlyPool {
        if (harvestBefore) {
            _harvest(user);
        }

        // update totalShares and userShares & userDebt
        totalShares = totalShares - userShares[user] + newUserShares;
        userShares[user] = newUserShares;
        // set debt to current snapshot
        userDebt[user] = int256((userShares[user] * accPosumPerShare) / PREC);
        emit SharesUpdated(user, newUserShares, totalShares);
    }

    /// @notice View pending rewards for a user
    function pending(address user) public view returns (uint256) {
        int256 accrued = int256((userShares[user] * accPosumPerShare) / PREC) - userDebt[user];
        if (accrued <= 0) return 0;
        return uint256(accrued);
    }

    /// @notice Harvest POSUM rewards for caller
    function harvest() external {
        _harvest(msg.sender);
    }

    function _harvest(address user) internal {
        uint256 amt = pending(user);
        if (amt == 0) return;
        // update debt
        userDebt[user] += int256(amt);
        require(posum.transfer(user, amt), "posum transfer failed");
        emit Harvested(user, amt);
    }

    // Admin emergency: recover tokens accidentally sent (owner only)
    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero");
        IERC20(token).transfer(to, amount);
    }
}
