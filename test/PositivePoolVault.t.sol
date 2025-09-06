// test/PositivePoolVault.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/PositivePoolVault.sol";
// --- CORRECTED IMPORT PATH ---
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "src/interfaces/IChainlink.sol";

// --- Mocks for testing ---
contract MockCompoundV3 {
    IERC20Metadata public immutable asset;
    address public immutable rewardToken;
    uint256 public supplyBalance;

    constructor(address _asset, address _rewardToken) {
        asset = IERC20Metadata(_asset);
        rewardToken = _rewardToken;
    }

    function supply(address, uint256 amount) external {
        asset.transferFrom(msg.sender, address(this), amount);
        supplyBalance += amount;
    }
    
    function withdraw(address, uint256 amount) external {
        asset.transfer(msg.sender, amount);
        supplyBalance -= amount;
    }

    function balanceOf(address) external view returns (uint256) {
        return supplyBalance;
    }

    function getRewardOwed(address) external view returns (address, uint256) {
        return (rewardToken, 100 * 1e18); 
    }

    function claim(address, address, address, uint256) external {}
}

contract MockERC20 is IERC20Metadata {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
}

contract MockPriceFeed is AggregatorV3Interface {
    function decimals() external pure returns (uint8) { return 18; }
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, 1 * 1e18, block.timestamp, block.timestamp, 1);
    }
}


contract PositivePoolVaultTest is Test {
    PositivePoolVault vault;
    MockCompoundV3 mockCompound;
    MockERC20 usdcToken;
    MockERC20 rewardToken;
    MockPriceFeed priceFeed;
    
    address owner = address(this);
    address user1 = address(0x123);

    function setUp() public {
        usdcToken = new MockERC20("Mock USDC", "mUSDC", 6);
        rewardToken = new MockERC20("Mock COMP", "mCOMP", 18);
        mockCompound = new MockCompoundV3(address(usdcToken), address(rewardToken));
        priceFeed = new MockPriceFeed();

        vault = new PositivePoolVault(
            owner,
            address(usdcToken),
            address(mockCompound),
            address(rewardToken),
            address(priceFeed)
        );
        
        usdcToken.mint(user1, 1000 * 1e6);
    }

    function test_DepositAndWithdraw() public {
        uint256 depositAmount = 100 * 1e6;
        
        vm.startPrank(user1);
        usdcToken.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        
        assertEq(vault.userShares(user1), depositAmount);
        assertEq(mockCompound.supplyBalance(), depositAmount);

        vault.withdraw(depositAmount);
        vm.stopPrank();

        assertEq(vault.userShares(user1), 0);
        assertEq(usdcToken.balanceOf(user1), 1000 * 1e6);
    }
}

