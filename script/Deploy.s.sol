// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "src/PoolFactory.sol";

contract DeployScript is Script {
    // --- Official Base Sepolia Addresses ---
    address constant BASE_SEPOLIA_ETH_USD_PRICE_FEED = 0x4aDC67696bA383F43DD60A9e78F2C97FbfB5D211;
    address constant BASE_SEPOLIA_USDC_USD_PRICE_FEED = 0x16F5A0738A42a962a970966a39ac252579080A55;
    address constant BASE_SEPOLIA_USDC_TOKEN = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant BASE_SEPOLIA_COMP_TOKEN = 0x2f535da74048c0874400f0371Fba20DF983A56e2;
    address constant BASE_SEPOLIA_COMPOUND_MARKET = 0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017;

    function run() external returns (address factoryAddress, address degenPoolAddress, address positivePoolAddress) {
        vm.startBroadcast();

        address deployerAddress = msg.sender;

        // 1. Deploy the PoolFactory
        PoolFactory factory = new PoolFactory(deployerAddress);
        factoryAddress = address(factory);
        console.log("PoolFactory deployed at:", factoryAddress);

        // 2. Create the DegenPoolV2
        degenPoolAddress = factory.createDegenPool(
            deployerAddress, // treasury wallet
            BASE_SEPOLIA_ETH_USD_PRICE_FEED,
            10000 // 100% APR in BPS
        );
        console.log("DegenPoolV2 created at:", degenPoolAddress);

        // 3. Create the PositivePoolVault for USDC
        positivePoolAddress = factory.createPositivePool(
            BASE_SEPOLIA_USDC_TOKEN,
            BASE_SEPOLIA_COMPOUND_MARKET,
            BASE_SEPOLIA_COMP_TOKEN,
            BASE_SEPOLIA_USDC_USD_PRICE_FEED,
            10000, // 1.0x flex multiplier in BPS
            15000, // 1.5x locked multiplier in BPS
            30 days
        );
        console.log("PositivePoolVault created at:", positivePoolAddress);

        vm.stopBroadcast();
    }
}

