// script/DeployMocks.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "src/mocks/MockUSDC.sol";

contract DeployMocks is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        // --- CORRECTED VARIABLE NAME ---
        MockUSDC mockUsdc = new MockUSDC();
        console.log("Mock USDC Deployed at:", address(mockUsdc));
        vm.stopBroadcast();
        return address(mockUsdc);
    }
}