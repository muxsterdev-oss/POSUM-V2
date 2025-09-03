// test/PositivePoolVault.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/PositivePoolVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PositivePoolVaultTest is Test {
    PositivePoolVault vault;
    
    // --- Official Base Sepolia Addresses ---
    IERC20 constant USDC = IERC20(0x036CbD53842c5426634e7929541eC2318f3dCF7e);
    ICompoundV3 constant COMPOUND_V3_USDC = ICompoundV3(0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017);
    address constant REWARD_TOKEN = 0x2f535da74048c0874400f0371Fba20DF983A56e2; // COMP Token
    address constant USDC_USD_PRICE_FEED = 0x16F5A0738A42a962a970966a39ac252579080A55;

    address owner = address(this);
    address user1 = address(0x123);
    address user2 = address(0x456);

    uint256 constant LOCK_DURATION = 30 days;
    uint16 constant FLEX_MULTIPLIER_BPS = 10000; // 1x
    uint16 constant LOCKED_MULTIPLIER_BPS = 15000; // 1.5x

    function setUp() public {
        vm.createSelectFork("baseSepolia");

        vault = new PositivePoolVault(
            owner,
            address(USDC),
            address(COMPOUND_V3_USDC),
            REWARD_TOKEN,
            USDC_USD_PRICE_FEED,
            FLEX_MULTIPLIER_BPS,
            LOCKED_MULTIPLIER_BPS,
            LOCK_DURATION
        );
        
        deal(address(USDC), user1, 1000 * 1e6);
        deal(address(USDC), user2, 1000 * 1e6);
    }

    function test_Deposit_Flex_And_SuppliesToCompound() public {
        uint256 depositAmount = 100 * 1e6; // 100 USDC

        vm.startPrank(user1);
        USDC.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, false);
        vm.stopPrank();
        
        assertTrue(COMPOUND_V3_USDC.balanceOf(address(vault)) > 0);
    }

    function test_Deposit_Locked_And_SuppliesToCompound() public {
        uint256 depositAmount = 100 * 1e6; // 100 USDC

        vm.startPrank(user1);
        USDC.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, true);
        vm.stopPrank();

        assertTrue(COMPOUND_V3_USDC.balanceOf(address(vault)) > 0);
        assertEq(vault.userLockEndDate(user1), block.timestamp + LOCK_DURATION);
    }

    function test_WithdrawLocked() public {
        uint256 depositAmount = 100 * 1e6;

        vm.startPrank(user1);
        USDC.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, true);

        vm.expectRevert("Lock period not expired");
        vault.withdrawLocked();

        vm.warp(block.timestamp + LOCK_DURATION + 1 days);
        vault.withdrawLocked();
        vm.stopPrank();

        assertEq(vault.userLockedShares(user1), 0);
    }

    function test_ClaimYield_IsProRata() public {
        uint256 user1Deposit = 100 * 1e6;
        uint256 user2Deposit = 300 * 1e6;

        vm.startPrank(user1);
        USDC.approve(address(vault), user1Deposit);
        vault.deposit(user1Deposit, false);
        vm.stopPrank();

        vm.startPrank(user2);
        USDC.approve(address(vault), user2Deposit);
        vault.deposit(user2Deposit, false);
        vm.stopPrank();

        vm.warp(block.timestamp + 90 days);

        uint256 claimableUser1 = vault.claimableYield(user1);
        uint256 claimableUser2 = vault.claimableYield(user2);

        assertTrue(claimableUser1 > 0, "User 1 should have claimable yield");
        assertTrue(claimableUser2 > 0, "User 2 should have claimable yield");
        assertApproxEqAbs(claimableUser2, claimableUser1 * 3, 1e5);

        uint256 user1CompBefore = IERC20(REWARD_TOKEN).balanceOf(user1);
        vm.prank(user1);
        vault.claimYield();
        assertTrue(IERC20(REWARD_TOKEN).balanceOf(user1) > user1CompBefore, "User 1 should have received COMP rewards");
    }
}
