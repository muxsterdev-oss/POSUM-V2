// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DegenPoolV2.sol";
import "./PositivePoolVault.sol";

/**
 * @title PoolFactory
 * @author POSUM Protocol
 * @notice A factory contract to deploy and track official POSUM protocol pools.
 */
contract PoolFactory is Ownable {
    address[] public degenPools;
    address[] public positivePoolVaults;

    enum PoolType { DEGEN, POSITIVE }

    struct PoolInfo {
        PoolType poolType;
        address poolAddress;
        address assetAddress; // For PositivePools, address(0) for DegenPools (ETH)
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

    /**
     * @notice Deploys a new DegenPoolV2 contract based on the final blueprint.
     */
    function createDegenPool(
        address _posumTokenAddress,
        address _uniswapRouterAddress,
        address _priceFeedAddress,
        address _liquidityReceiver
    ) external onlyOwner returns (address) {
        DegenPoolV2 newDegenPool = new DegenPoolV2(
            owner(),
            _posumTokenAddress,
            _uniswapRouterAddress,
            _priceFeedAddress,
            _liquidityReceiver
        );
        
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

    /**
     * @notice Deploys a new, flexible-only PositivePoolVault contract.
     */
    function createPositivePool(
        address _assetAddress,
        address _compoundMarketAddress,
        address _rewardTokenAddress,
        address _priceFeedAddress
    ) external onlyOwner returns (address) {
        PositivePoolVault newPositivePool = new PositivePoolVault(
            owner(),
            _assetAddress,
            _compoundMarketAddress,
            _rewardTokenAddress,
            _priceFeedAddress
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

