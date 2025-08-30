// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "src/PoolFactory.sol";

contract DeployScript is Script {
    // --- CORRECTED CHECKSUM ---
    address constant BASE_SEPOLIA_ETH_USD_PRICE_FEED = 0x4adc67696bA383F43dd60a9E78F2C97fbfB5d211;

    function run() external returns (address factoryAddress, address degenPoolAddress, address positivePoolAddress) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployerAddress = vm.addr(deployerPrivateKey);

        PoolFactory factory = new PoolFactory(deployerAddress);
        factoryAddress = address(factory);
        console.log("PoolFactory deployed at:", factoryAddress);

        degenPoolAddress = factory.createDegenPool(deployerAddress, BASE_SEPOLIA_ETH_USD_PRICE_FEED);
        console.log("First DegenPoolV2 created at:", degenPoolAddress);

        address mockUsdcAddress = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        uint256 thirtyDaysInSeconds = 30 * 24 * 60 * 60;
        positivePoolAddress = factory.createPositivePool(mockUsdcAddress, thirtyDaysInSeconds);
        console.log("First PositivePoolVault created at:", positivePoolAddress);

        vm.stopBroadcast();
    }
}

