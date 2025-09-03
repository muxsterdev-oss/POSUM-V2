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

    function createDegenPool(
        address _treasuryWallet, 
        address _priceFeedAddress,
        uint256 _aprBps
    ) external onlyOwner returns (address) {
        require(_treasuryWallet != address(0), "Factory: Treasury cannot be zero address");
        require(_priceFeedAddress != address(0), "Factory: Price feed cannot be zero address");
        
        DegenPoolV2 newDegenPool = new DegenPoolV2(owner(), _treasuryWallet, _priceFeedAddress, _aprBps);
        
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
        address _compoundMarketAddress,
        address _rewardTokenAddress,
        address _priceFeedAddress,
        uint16 _flexMultiplierBps,
        uint16 _lockedMultiplierBps,
        uint256 _lockDurationSeconds
    ) external onlyOwner returns (address) {
        PositivePoolVault newPositivePool = new PositivePoolVault(
            owner(),
            _assetAddress,
            _compoundMarketAddress,
            _rewardTokenAddress,
            _priceFeedAddress,
            _flexMultiplierBps,
            _lockedMultiplierBps,
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