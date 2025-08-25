// test/PositivePoolVault.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/PositivePoolVault.sol"; // This file already contains the ICompoundV3 interface
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PositivePoolVaultTest is Test {
    uint256 forkId;
    PositivePoolVault vault;
    
    IERC20 constant USDbC = IERC20(0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA);
    // We get the ICompoundV3 type from importing PositivePoolVault.sol
    ICompoundV3 constant COMPOUND_V3_USDbC = ICompoundV3(0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf);
    
    address owner = address(this);
    address user1 = address(0x123);
    address usdbcWhale = 0x4f3a120e72c7e920526E36848289a326402a3515;

    uint256 constant LOCK_DURATION = 30 days;
    uint16 constant FLEX_MULTIPLIER = 100;
    uint16 constant LOCKED_MULTIPLIER = 150;

    function setUp() public {
        forkId = vm.createFork(vm.rpcUrl("base"), 15133600);
        vm.selectFork(forkId);

        vault = new PositivePoolVault(
            owner,
            address(USDbC),
            FLEX_MULTIPLIER,
            LOCKED_MULTIPLIER,
            LOCK_DURATION
        );
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