// test/DegenPoolV2.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/DegenPoolV2.sol";
import "src/POSUM.sol";
import "src/interfaces/IChainlink.sol";

// --- Mocks for testing ---
contract MockUniswapRouter {
    function addLiquidityETH(address token, uint, uint, uint, address, uint) external payable returns (uint, uint, uint) {
        POSUM(token).transferFrom(msg.sender, address(this), 1); // Simulate taking some token
        return (1, 1, 1);
    }
}

contract MockPriceFeed is AggregatorV3Interface {
    function decimals() external pure returns (uint8) { return 8; }
    
    // --- CORRECTED THIS LINE from 'pure' to 'view' ---
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, 2000 * 1e8, block.timestamp, block.timestamp, 1); // Simulate $2000 ETH price
    }
}

contract DegenPoolV2Test is Test {
    DegenPoolV2 degenPool;
    POSUM posumToken;
    address owner = address(this);
    address user1 = address(0x123);
    address liquidityReceiver = address(0x456);

    function setUp() public {
        posumToken = new POSUM(address(this));
        MockUniswapRouter router = new MockUniswapRouter();
        MockPriceFeed priceFeed = new MockPriceFeed();

        degenPool = new DegenPoolV2(
            owner,
            address(posumToken),
            address(router),
            address(priceFeed),
            liquidityReceiver
        );

        // Fund the degen pool with POSUM for liquidity pairing
        posumToken.transfer(address(degenPool), 1_000_000 * 1e18);
        vm.deal(user1, 10 ether);
    }

    function test_Deposit_SplitsFundsAndLocks() public {
        uint256 depositAmount = 1 ether;

        vm.startPrank(user1);
        degenPool.deposit{value: depositAmount}();
        vm.stopPrank();

        assertEq(degenPool.userDeposits(user1), depositAmount, "Total deposit not recorded");
        assertEq(degenPool.userPrincipalClaimable(user1), depositAmount / 2, "Claimable principal is not 50%");
        assertTrue(degenPool.userUnlockTimestamp(user1) > block.timestamp, "Unlock timestamp not set");
    }

    function test_FoundersWeek_Cap() public {
        vm.startPrank(user1);
        degenPool.deposit{value: 1 ether}(); // First deposit is fine

        // Second deposit should fail if it exceeds the cap
        vm.expectRevert("Exceeds Founder's Week cap");
        degenPool.deposit{value: 0.1 ether}();
        vm.stopPrank();
        
        // After 7 days, the cap should be lifted
        vm.warp(block.timestamp + 8 days);

        vm.startPrank(user1);
        degenPool.deposit{value: 0.1 ether}(); // Should now succeed
        vm.stopPrank();

        assertEq(degenPool.userDeposits(user1), 1.1 ether);
    }

    function test_ClaimPrincipal_AfterLock() public {
        vm.startPrank(user1);
        degenPool.deposit{value: 1 ether}();
        vm.stopPrank();
        
        // Should fail before lock expires
        vm.expectRevert("Lock period not expired");
        vm.prank(user1);
        degenPool.claimPrincipal();
        
        // Should succeed after lock expires
        vm.warp(block.timestamp + 91 days);
        
        uint256 userBalanceBefore = user1.balance;
        
        vm.prank(user1);
        degenPool.claimPrincipal();

        assertEq(degenPool.userPrincipalClaimable(user1), 0, "Claimable principal should be zero after claim");
        assertEq(user1.balance, userBalanceBefore + 0.5 ether, "User did not receive correct principal");
    }
}

