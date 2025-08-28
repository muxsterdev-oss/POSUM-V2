// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {PoolFactory} from "../src/PoolFactory.sol";

contract Deploy is Script {
    function run() external returns (address factoryAddress, address degenPoolAddress, address positivePoolAddress) {
        // Get the private key for the deployer account from your environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        // Start broadcasting transactions from the deployer's wallet
        vm.startBroadcast(deployerPrivateKey);

        // --- 1. Deploy the PoolFactory ---
        PoolFactory factory = new PoolFactory(deployerAddress);
        factoryAddress = address(factory);
        console.log("PoolFactory deployed at:", factoryAddress);

        // --- 2. Create the first Degen Pool via the Factory ---
        degenPoolAddress = factory.createDegenPool(deployerAddress);
        console.log("First DegenPoolV2 created at:", degenPoolAddress);
        
        // --- 3. Create the first Positive Pool (for USDC) ---
        // For local testing, we'll use a placeholder address for USDC and a 30-day lock.
        // FIXED: Corrected the address checksum
        address mockUsdcAddress = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        uint256 thirtyDaysInSeconds = 30 * 24 * 60 * 60;
        positivePoolAddress = factory.createPositivePool(mockUsdcAddress, thirtyDaysInSeconds);
        console.log("First PositivePoolVault created at:", positivePoolAddress);

        // Stop broadcasting transactions
        vm.stopBroadcast();

        return (factoryAddress, degenPoolAddress, positivePoolAddress);
    }
}
