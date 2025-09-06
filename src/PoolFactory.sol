// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PoolFactory (MVP)
 * @notice Simple factory to deploy DegenPool & PositivePool (using known bytecode clones or direct).
 * For now this factory will only register pool addresses and authorize them in SUMPoints.
 *
 * NOTE: For simplicity we assume DegenPool and PositivePool constructors are called externally or deployed
 * and then registered via this factory. You can expand to actually `new` them from here later.
 */
contract PoolFactory is Ownable {
    address[] public pools;
    address public sumPoints;

    event PoolRegistered(address indexed pool);
    event SetSumPoints(address indexed sp);

    constructor(address _owner, address _sumPoints) {
        transferOwnership(_owner);
        sumPoints = _sumPoints;
    }

    function setSumPoints(address _sum) external onlyOwner {
        sumPoints = _sum;
        emit SetSumPoints(_sum);
    }

    // register an existing pool; factory will optionally call SUMPoints.setAuthorized(pool, true)
    function registerPool(address pool) external onlyOwner {
        require(pool != address(0), "zero");
        pools.push(pool);

        // if sumPoints supports setAuthorized(pool,true) we can call it (best-effort)
        if (sumPoints != address(0)) {
            // attempt to call setAuthorized(address,bool) on sumPoints (owner must be factory or multisig)
            // This is best-effort; it will not revert factory if call fails
            (bool ok, ) = sumPoints.call(abi.encodeWithSignature("setAuthorized(address,bool)", pool, true));
            // ignore ok result
        }

        emit PoolRegistered(pool);
    }

    function allPools() external view returns (address[] memory) {
        return pools;
    }
}
