// test/PositivePoolVault.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/PositivePoolVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PositivePoolVaultTest is Test {
    PositivePoolVault vault;
    
    // --- CORRECTED ADDRESSES FOR BASE SEPOLIA ---
    IERC20 constant USDbC = IERC20(0x036CbD53842c5426634e7929541eC2318f3dCF7e);
    ICompoundV3 constant COMPOUND_V3_USDbC = ICompoundV3(0x45E054f5541C13437149226312e432073D6b422b);
    address constant COMPOUND_MARKET_OWNER = 0x1242940283b2721a52836248D6139C5c5521873b;
    
    address owner = address(this);
    address user1 = address(0x123);

    uint256 constant LOCK_DURATION = 30 days;
    uint16 constant FLEX_MULTIPLIER = 100;
    uint16 constant LOCKED_MULTIPLIER = 150;

    function setUp() public {
        // --- FORK BASE SEPOLIA FOR CONSISTENCY ---
        string memory baseURL = vm.envString("BASE_RPC_URL");
        vm.createSelectFork(baseURL);

        vault = new PositivePoolVault(
            owner,
            address(USDbC),
            FLEX_MULTIPLIER,
            LOCKED_MULTIPLIER,
            LOCK_DURATION
        );

        // --- GRANT PERMISSION TO THE VAULT ---
        vm.prank(COMPOUND_MARKET_OWNER);
        COMPOUND_V3_USDbC.allow(address(vault), true);
    }

    function test_Deposit_Flex_And_SuppliesToCompound() public {
        uint256 depositAmount = 1_000_000; // 1 USDbC
        deal(address(USDbC), user1, depositAmount);

        vm.startPrank(user1);
        USDbC.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, false);
        vm.stopPrank();
        
        assertTrue(COMPOUND_V3_USDbC.balanceOf(address(vault)) > 0);
    }

    function test_Deposit_Locked_And_SuppliesToCompound() public {
        uint256 depositAmount = 1_000_000; // 1 USDbC
        deal(address(USDbC), user1, depositAmount);

        vm.startPrank(user1);
        USDbC.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, true);
        vm.stopPrank();

        assertTrue(COMPOUND_V3_USDbC.balanceOf(address(vault)) > 0);
        assertEq(vault.userLockEndDate(user1), block.timestamp + LOCK_DURATION);
    }
}