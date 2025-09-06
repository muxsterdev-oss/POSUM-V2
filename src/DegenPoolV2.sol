// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IChainlink.sol";
import "./POSUM.sol";

interface IUniswapV2Router {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

contract DegenPoolV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for POSUM;

    // --- Core State ---
    POSUM public immutable posumToken;
    IUniswapV2Router public immutable uniswapRouter;
    AggregatorV3Interface internal immutable priceFeed;
    address public liquidityReceiver; // Address that holds the LP tokens

    // --- Pool Mechanics ---
    uint256 public constant DEPOSIT_LOCK_DURATION = 90 days;
    uint256 public constant FOUNDERS_WEEK_DURATION = 7 days;
    uint256 public constant FOUNDERS_WEEK_CAP = 1 ether;
    uint256 public launchTimestamp;

    // --- User Accounting ---
    mapping(address => uint256) public userDeposits; // Total ETH deposited by user
    mapping(address => uint256) public userPrincipalClaimable; // 50% of their deposit, claimable after lock
    mapping(address => uint256) public userUnlockTimestamp;
    
    // --- Events ---
    event Deposited(address indexed user, uint256 ethAmount, uint256 liquidityAmount);
    event PrincipalClaimed(address indexed user, uint256 amount);

    constructor(
        address initialOwner, 
        address _posumTokenAddress,
        address _uniswapRouterAddress,
        address _priceFeedAddress,
        address _liquidityReceiver
    ) Ownable(initialOwner) {
        posumToken = POSUM(_posumTokenAddress);
        uniswapRouter = IUniswapV2Router(_uniswapRouterAddress);
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        liquidityReceiver = _liquidityReceiver;
        launchTimestamp = block.timestamp;
    }

    // --- MUTATIVE FUNCTIONS ---

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit must be > 0");

        if (block.timestamp < launchTimestamp + FOUNDERS_WEEK_DURATION) {
            require(userDeposits[msg.sender] + msg.value <= FOUNDERS_WEEK_CAP, "Exceeds Founder's Week cap");
        }

        uint256 liquidityAmount = msg.value / 2;
        uint256 principalToReturn = msg.value - liquidityAmount;

        _provideLiquidity(liquidityAmount);

        userDeposits[msg.sender] += msg.value;
        userPrincipalClaimable[msg.sender] += principalToReturn;
        
        userUnlockTimestamp[msg.sender] = block.timestamp + DEPOSIT_LOCK_DURATION;

        emit Deposited(msg.sender, msg.value, liquidityAmount);
    }

    function claimPrincipal() external nonReentrant {
        require(block.timestamp >= userUnlockTimestamp[msg.sender], "Lock period not expired");
        uint256 claimableAmount = userPrincipalClaimable[msg.sender];
        require(claimableAmount > 0, "No principal to claim");

        userPrincipalClaimable[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: claimableAmount}("");
        require(success, "ETH transfer failed");

        emit PrincipalClaimed(msg.sender, claimableAmount);
    }

    function _provideLiquidity(uint256 _ethAmount) internal {
        uint256 posumAmount = _getEquivalentPosumAmount(_ethAmount);
        
        require(posumToken.balanceOf(address(this)) >= posumAmount, "Insufficient POSUM for liquidity");

        posumToken.approve(address(uniswapRouter), posumAmount);

        uniswapRouter.addLiquidityETH{value: _ethAmount}(
            address(posumToken),
            posumAmount,
            0, 
            0, 
            liquidityReceiver,
            block.timestamp
        );
    }

    // --- VIEW FUNCTIONS ---

    function _getLatestPrice() internal view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "DegenPool: Invalid price from oracle");
        require(block.timestamp - updatedAt < 1 hours, "DegenPool: Stale price from oracle");
        
        uint8 decimals = priceFeed.decimals();
        if (decimals == 18) return uint256(price);
        if (decimals < 18) return uint256(price) * (10 ** (18 - decimals));
        return uint256(price) / (10 ** (decimals - 18));
    }
    
    function _getEquivalentPosumAmount(uint256 _ethAmount) internal view returns (uint256) {
        uint256 ethPriceInUSD = _getLatestPrice(); 
        uint256 posumLaunchPriceInUSD = 0.1 * (10**18); // Placeholder: $0.10
        
        uint256 ethValueInUSD = (_ethAmount * ethPriceInUSD) / 1e18;
        return (ethValueInUSD * (10**18)) / posumLaunchPriceInUSD;
    }

    function setLiquidityReceiver(address _newReceiver) external onlyOwner {
        require(_newReceiver != address(0), "Cannot be zero address");
        liquidityReceiver = _newReceiver;
    }
}

