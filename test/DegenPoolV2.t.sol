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
    
    address constant BASE_SEPOLIA_ETH_USD_PRICE_FEED = 0x4adc67696bA383F43dd60a9E78F2C97fbfB5d211;

    function setUp() public {
        vm.createSelectFork("baseSepolia");

        // --- UPDATED CONSTRUCTOR CALL ---
        degenPool = new DegenPoolV2(
            owner, 
            treasury, 
            BASE_SEPOLIA_ETH_USD_PRICE_FEED,
            10000 // 100% APR
        );
        
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
        vm.prank(owner);
        degenPool.fundRewards{value: 5 ether}();

        vm.prank(user1);
        degenPool.deposit{value: 1 ether}();

        vm.warp(block.timestamp + 365 days);

        uint256 claimableBefore = degenPool.getTotalClaimable(user1);
        assertTrue(claimableBefore > 0, "Claimable should be greater than zero");

        vm.prank(user1);
        degenPool.claim();

        assertEq(degenPool.getTotalClaimable(user1), 0, "Claimable should be zero after claim");
    }

    function testClaimRevertsWhenInsufficientFundedRewards() public {
        vm.prank(user1);
        degenPool.deposit{value: 1 ether}();

        vm.warp(block.timestamp + 365 days);

        vm.expectRevert("DegenPool: Insufficient reward pool");
        vm.prank(user1);
        degenPool.claim();
    }

    function testFundingThenClaimSucceeds() public {
        uint256 initialUserBalance = user1.balance;
        uint256 initialTreasuryBalance = treasury.balance;
        uint256 fundingAmount = 5 ether;

        vm.prank(owner);
        degenPool.fundRewards{value: fundingAmount}();
        assertEq(degenPool.rewardPool(), fundingAmount);

        vm.prank(user1);
        degenPool.deposit{value: 1 ether}();

        vm.warp(block.timestamp + 365 days);

        uint256 claimableAmount = degenPool.getTotalClaimable(user1);
        uint256 feeAmount = (claimableAmount * degenPool.TREASURY_FEE_BPS()) / 10000;
        uint256 userAmount = claimableAmount - feeAmount;

        vm.prank(user1);
        degenPool.claim();
        
        assertTrue(user1.balance > initialUserBalance, "User balance should increase");
        assertEq(treasury.balance, initialTreasuryBalance + feeAmount, "Treasury did not receive correct fee");
        assertEq(degenPool.rewardPool(), fundingAmount - claimableAmount, "Reward pool not debited correctly");
    }

    function testStalePriceReverts() public {
        vm.prank(user1);
        degenPool.deposit{value: 1 ether}();
        
        vm.warp(block.timestamp + 2 hours);

        vm.expectRevert("DegenPool: Stale price from oracle");
        degenPool.getCurrentSumPoints(user1);
    }
}

