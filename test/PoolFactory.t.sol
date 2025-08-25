// test/PoolFactory.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PoolFactory.sol";
import "../src/DegenPoolV2.sol";
import "../src/PositivePoolVault.sol";

contract PoolFactoryTest is Test {
    PoolFactory factory;
    address owner = address(0xABCD);
    address user = address(0x1234);
    address treasury = address(0xBEEF);
    address asset = address(0xCAFE);

    function setUp() public {
        vm.prank(owner);
        factory = new PoolFactory(owner);
    }

    // ... (Degen Pool tests are unchanged)

    function testCreatePositivePoolOnlyOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user));
        factory.createPositivePool(asset, 7 days);
    }

    // ... (rest of the tests need to be updated to match the simpler call)
}