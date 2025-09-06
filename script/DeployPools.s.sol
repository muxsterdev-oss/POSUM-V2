// script/DeployPools.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "src/PoolFactory.sol";
import "src/POSUM.sol";

contract DeployPools is Script {
    // --- Official Base Sepolia Addresses ---
    address constant BASE_SEPOLIA_ETH_USD_PRICE_FEED = 0x4adc67696bA383F43dd60a9E78F2C97fbfB5d211;
    address constant BASE_SEPOLIA_USDC_TOKEN = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant BASE_SEPOLIA_COMPOUND_MARKET = 0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017;
    address constant BASE_SEPOLIA_COMP_TOKEN = 0x2f535da74048c0874400f0371Fba20DF983A56e2;
    address constant BASE_SEPOLIA_USDC_USD_PRICE_FEED = 0x16f5a0738A42a962A970966A39ac252579080A55;
    address constant UNISWAP_V2_ROUTER = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        POSUM posumToken = new POSUM(deployerAddress);
        console.log("Deployed placeholder POSUM token at:", address(posumToken));

        PoolFactory factory = new PoolFactory(deployerAddress);
        console.log("PoolFactory deployed at:", address(factory));

        factory.createDegenPool(
            address(posumToken),
            UNISWAP_V2_ROUTER,
            BASE_SEPOLIA_ETH_USD_PRICE_FEED,
            deployerAddress
        );
        
        factory.createPositivePool(
            BASE_SEPOLIA_USDC_TOKEN,
            BASE_SEPOLIA_COMPOUND_MARKET,
            BASE_SEPOLIA_COMP_TOKEN,
            BASE_SEPOLIA_USDC_USD_PRICE_FEED
        );
        
        console.log("DegenPoolV2 created at:", factory.degenPools(0));
        console.log("PositivePoolVault created at:", factory.positivePoolVaults(0));

        vm.stopBroadcast();
    }
}