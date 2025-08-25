// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DegenPoolV2.sol";

contract DegenPoolV2Test is Test {
    // === STATE VARIABLES ===
    DegenPoolV2 degenPool;
    address owner = address(0xABCD);
    address treasury = address(0xBEEF);
    address user1 = address(0x1);
    address user2 = address(0x2);

    // === SETUP ===
    // This function runs before each test case.
    function setUp() public {
        // Deploy a new DegenPoolV2 contract for each test to ensure a clean state.
        degenPool = new DegenPoolV2(owner, treasury);
    }

    // === DEPOSIT TESTS ===

    function test_Deposit_IssuesSharesCorrectly() public {
        // 1. Arrange
        uint256 depositAmount = 1 ether;
        // NEW: Give user1 a starting balance of 5 ETH so they can make the deposit.
        vm.deal(user1, 5 ether);

        // 2. Act
        vm.prank(user1);
        degenPool.deposit{value: depositAmount}();

        // 3. Assert
        assertEq(degenPool.userShares(user1), depositAmount, "User should receive shares equal to their deposit");
    }

    function test_Deposit_IncreasesTotalDeposited() public {
        // Test logic will go here
    }

    function test_Deposit_UpdatesUserPoints() public {
        // Test logic will go here
    }

    function test_Deposit_RevertsOnZeroAmount() public {
        // Test logic will go here
    }

    function test_Deposit_EmitsDepositedEvent() public {
        // Test logic will go here
    }

    // === CLAIM TESTS ===

    function test_Claim_TransfersCorrectAmountToUserAndTreasury() public {
        // Test logic will go here
    }

    function test_Claim_ResetsRewardsToZero() public {
        // Test logic will go here
    }

    function test_Claim_RevertsIfNoRewards() public {
        // Test logic will go here
    }

    function test_Claim_EmitsClaimedEvent() public {
        // Test logic will go here
    }

    // === ADMIN & SECURITY TESTS ===
    
    function test_SetTreasuryWallet_OnlyOwner() public {
        // Test logic will go here
    }

    function test_RescueTokens_OnlyOwner() public {
        // Test logic will go here
    }

    function test_RescueTokens_CannotRescueNativeETH() public {
        // This test requires a helper contract, we can do it later.
    }
}