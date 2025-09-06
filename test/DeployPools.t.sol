// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/PoolFactory.sol";
import "src/DegenPoolV2.sol";
import "src/PositivePoolVault.sol";
import "src/POSUM.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// --- Mocks for testing ---
contract MockERC20 is IERC20Metadata {
    string public name;
    string public symbol;
    uint8 public decimals;
    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }
    function totalSupply() external view returns (uint256) { return 0; }
    function balanceOf(address) external view returns (uint256) { return 0; }
    function transfer(address, uint256) external returns (bool) { return true; }
    function allowance(address, address) external view returns (uint256) { return 0; }
    function approve(address, uint256) external returns (bool) { return true; }
    function transferFrom(address, address, uint256) external returns (bool) { return true; }
}

contract DeployPoolsTest is Test {
    PoolFactory factory;
    POSUM posumToken;
    address owner = address(this);
    
    // --- MOCK CONTRACTS INSTEAD OF DUMMY ADDRESSES ---
    MockERC20 mockUsdc;
    MockERC20 mockComp;
    address MOCK_ROUTER = address(0x1);
    address MOCK_PRICE_FEED = address(0x2);
    address MOCK_RECEIVER = address(0x3);
    address MOCK_MARKET = address(0x5);

    function setUp() public {
        posumToken = new POSUM(owner);
        factory = new PoolFactory(owner);
        mockUsdc = new MockERC20("Mock USDC", "mUSDC", 6);
        mockComp = new MockERC20("Mock COMP", "mCOMP", 18);
    }

    function test_DeploymentLogic() public {
        // --- Test Degen Pool Creation ---
        address degenPoolAddress = factory.createDegenPool(
            address(posumToken),
            MOCK_ROUTER,
            MOCK_PRICE_FEED,
            MOCK_RECEIVER
        );
        assertEq(factory.getDegenPoolCount(), 1);
        assertEq(factory.degenPools(0), degenPoolAddress);
        assertEq(DegenPoolV2(payable(degenPoolAddress)).owner(), owner);

        // --- Test Positive Pool Creation ---
        address positivePoolAddress = factory.createPositivePool(
            address(mockUsdc),
            MOCK_MARKET,
            address(mockComp),
            MOCK_PRICE_FEED
        );
        assertEq(factory.getPositivePoolCount(), 1);
        assertEq(factory.positivePoolVaults(0), positivePoolAddress);
        assertEq(PositivePoolVault(payable(positivePoolAddress)).owner(), owner);
    }
}