// src/PoolFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DegenPoolV2.sol";
import "./PositivePoolVault.sol";

contract PoolFactory is Ownable {
    address[] public degenPools;
    address[] public positivePoolVaults;

    enum PoolType { DEGEN, POSITIVE, IGNITION }

    struct PoolInfo {
        PoolType poolType;
        address poolAddress;
        address assetAddress;
        uint256 createdAt;
    }

    mapping(address => PoolInfo) public poolInfo;

    event PoolCreated(
        PoolType indexed poolType,
        address indexed poolAddress,
        address assetAddress,
        address creator
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    // --- UPDATED THIS FUNCTION ---
    function createDegenPool(
        address _treasuryWallet, 
        address _priceFeedAddress
    ) external onlyOwner returns (address) {
        require(_treasuryWallet != address(0), "Factory: Treasury cannot be zero address");
        require(_priceFeedAddress != address(0), "Factory: Price feed cannot be zero address");
        
        // Now passing all three required arguments
        DegenPoolV2 newDegenPool = new DegenPoolV2(owner(), _treasuryWallet, _priceFeedAddress);
        
        address poolAddress = address(newDegenPool);
        degenPools.push(poolAddress);
        poolInfo[poolAddress] = PoolInfo({
            poolType: PoolType.DEGEN,
            poolAddress: poolAddress,
            assetAddress: address(0), // ETH pool
            createdAt: block.timestamp
        });
        emit PoolCreated(PoolType.DEGEN, poolAddress, address(0), owner());
        return poolAddress;
    }

    function createPositivePool(
        address _assetAddress,
        uint256 _lockDurationSeconds
    ) external onlyOwner returns (address) {
        require(_assetAddress != address(0), "Factory: Invalid address");
        require(_lockDurationSeconds > 0, "Factory: Lock duration must be > 0");

        PositivePoolVault newPositivePool = new PositivePoolVault(
            owner(),
            _assetAddress,
            100, // FLEX_MULTIPLIER (1.0x)
            150, // LOCKED_MULTIPLIER (1.5x)
            _lockDurationSeconds
        );
        address poolAddress = address(newPositivePool);

        positivePoolVaults.push(poolAddress);
        poolInfo[poolAddress] = PoolInfo({
            poolType: PoolType.POSITIVE,
            poolAddress: poolAddress,
            assetAddress: _assetAddress,
            createdAt: block.timestamp
        });
        emit PoolCreated(PoolType.POSITIVE, poolAddress, _assetAddress, owner());
        return poolAddress;
    }

    function getDegenPoolCount() external view returns (uint256) {
        return degenPools.length;
    }

    function getPositivePoolCount() external view returns (uint256) {
        return positivePoolVaults.length;
    }
}