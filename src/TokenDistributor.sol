// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./POSUM.sol";

/**
 * @title TokenDistributor
 * @author POSUM Protocol
 * @notice A contract to distribute the initial POSUM token supply according to the tokenomics plan.
 */
contract TokenDistributor is Ownable {
    using SafeERC20 for POSUM;

    POSUM public immutable posumToken;

    // --- Tokenomics Allocations (Based on 200M total supply) ---
    uint256 public constant TEAM_ALLOCATION = 20_000_000 * (10 ** 18);      // 10%
    uint256 public constant REWARDS_ALLOCATION = 130_000_000 * (10 ** 18); // 65% (Degen + Positive + Forage)
    uint256 public constant LIQUIDITY_ALLOCATION = 30_000_000 * (10 ** 18);  // 15%
    uint256 public constant TREASURY_ALLOCATION = 20_000_000 * (10 ** 18);  // 10%

    bool public hasDistributedTeamTokens;
    bool public hasDistributedRewardsTokens;
    bool public hasDistributedLiquidityTokens;
    bool public hasDistributedTreasuryTokens;

    event TokensDistributed(string indexed allocation, address indexed destination, uint256 amount);

    constructor(address _posumTokenAddress, address initialOwner) Ownable(initialOwner) {
        require(_posumTokenAddress != address(0), "Token address cannot be zero");
        posumToken = POSUM(_posumTokenAddress);
        
        uint256 expectedSupply = TEAM_ALLOCATION + REWARDS_ALLOCATION + LIQUIDITY_ALLOCATION + TREASURY_ALLOCATION;
        require(posumToken.TOTAL_SUPPLY() == expectedSupply, "Allocation amounts do not match total supply");
        require(posumToken.balanceOf(address(this)) >= expectedSupply, "Distributor must hold total supply");
    }

    /**
     * @notice Distributes the team's token allocation to the vesting contract.
     * @param _vestingContract The address of the deployed TeamVesting contract.
     */
    function distributeTeamTokens(address _vestingContract) external onlyOwner {
        require(!hasDistributedTeamTokens, "Team tokens already distributed");
        
        posumToken.safeTransfer(_vestingContract, TEAM_ALLOCATION);
        hasDistributedTeamTokens = true;

        emit TokensDistributed("Team/Advisors", _vestingContract, TEAM_ALLOCATION);
    }

    /**
     * @notice Distributes the community rewards allocation to the RewardsDistributor contract.
     * @param _rewardsContract The address of the deployed RewardsDistributor contract.
     */
    function distributeRewards(address _rewardsContract) external onlyOwner {
        require(!hasDistributedRewardsTokens, "Rewards tokens already distributed");
        
        posumToken.safeTransfer(_rewardsContract, REWARDS_ALLOCATION);
        hasDistributedRewardsTokens = true;

        emit TokensDistributed("Community Rewards", _rewardsContract, REWARDS_ALLOCATION);
    }

    /**
     * @notice Distributes the protocol liquidity allocation to a specified address (e.g., a multisig).
     * @param _liquidityManager The address that will manage the protocol's liquidity.
     */
    function distributeLiquidity(address _liquidityManager) external onlyOwner {
        require(!hasDistributedLiquidityTokens, "Liquidity tokens already distributed");
        
        posumToken.safeTransfer(_liquidityManager, LIQUIDITY_ALLOCATION);
        hasDistributedLiquidityTokens = true;
        
        emit TokensDistributed("Protocol Liquidity", _liquidityManager, LIQUIDITY_ALLOCATION);
    }

    /**
     * @notice Distributes the treasury allocation to the community treasury (Gnosis Safe).
     * @param _treasuryAddress The address of the community treasury.
     */
    function distributeTreasury(address _treasuryAddress) external onlyOwner {
        require(!hasDistributedTreasuryTokens, "Treasury tokens already distributed");
        
        posumToken.safeTransfer(_treasuryAddress, TREASURY_ALLOCATION);
        hasDistributedTreasuryTokens = true;

        emit TokensDistributed("Community Treasury", _treasuryAddress, TREASURY_ALLOCATION);
    }
}

