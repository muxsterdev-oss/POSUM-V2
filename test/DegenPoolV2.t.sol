// test/DegenPoolV2.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/DegenPoolV2.sol";

contract DegenPoolV2Test is Test {
    DegenPoolV2 degenPool;
    address owner = address(0x1);
    address user1 = address(0x2);
    address treasury = address(0x3);
    
    address constant BASE_SEPOLIA_ETH_USD_PRICE_FEED = 0x4aDC67696bA383F43DD60A9e78F2C97FbfB5D211;

    function setUp() public {
        string memory baseURL = vm.envString("BASE_RPC_URL");
        vm.createSelectFork(baseURL);

        degenPool = new DegenPoolV2(owner, treasury, BASE_SEPOLIA_ETH_USD_PRICE_FEED);
        
        vm.deal(user1, 10 ether);
        vm.deal(address(degenPool), 100 ether);
        vm.deal(treasury, 10 ether);
    }

    function testDeposit() public {
        vm.prank(user1);
        degenPool.deposit{value: 1 ether}();
        assertEq(degenPool.userShares(user1), 1 ether);
        assertEq(degenPool.totalDeposited(), 1 ether);
    }

    function testClaimYield() public {
        vm.prank(user1);
        degenPool.deposit{value: 1 ether}();

        // Simulate time passing
        vm.warp(block.timestamp + 365 days);

        uint256 claimableBefore = degenPool.getTotalClaimable(user1);
        assertTrue(claimableBefore > 0, "Claimable should be greater than zero");

        vm.prank(user1);
        degenPool.claim();

        assertEq(degenPool.getTotalClaimable(user1), 0, "Claimable should be zero after claim");
    }
}