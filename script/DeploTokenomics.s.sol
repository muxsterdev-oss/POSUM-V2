// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "src/POSUM.sol";
import "src/TokenDistributor.sol";
import "src/TeamVesting.sol";
import "src/RewardsDistributor.sol";

contract DeployTokenomics is Script {
    function run()
        external
        returns (
            POSUM,
            TokenDistributor,
            TeamVesting,
            RewardsDistributor
        )
    {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the POSUM Token
        POSUM posumToken = new POSUM(deployerAddress);
        console.log("POSUM Token deployed at:", address(posumToken));

        // 2. Deploy the main TokenDistributor
        TokenDistributor tokenDistributor = new TokenDistributor(address(posumToken), deployerAddress);
        console.log("TokenDistributor deployed at:", address(tokenDistributor));

        // 3. Transfer the total supply to the TokenDistributor
        posumToken.transfer(address(tokenDistributor), posumToken.TOTAL_SUPPLY());
        console.log("Total supply transferred to TokenDistributor.");

        // 4. Deploy the vesting and rewards contracts
        TeamVesting teamVesting = new TeamVesting(address(posumToken), deployerAddress);
        console.log("TeamVesting contract deployed at:", address(teamVesting));

        RewardsDistributor rewardsDistributor = new RewardsDistributor(address(posumToken), deployerAddress);
        console.log("RewardsDistributor contract deployed at:", address(rewardsDistributor));

        // 5. Execute the on-chain distribution
        tokenDistributor.distributeTeamTokens(address(teamVesting));
        console.log("Team tokens distributed to vesting contract.");

        tokenDistributor.distributeRewards(address(rewardsDistributor));
        console.log("Rewards tokens distributed to rewards contract.");

        // For the initial deployment, the deployer's address will manage liquidity and treasury funds.
        // On mainnet, these would be a Gnosis Safe multisig.
        tokenDistributor.distributeLiquidity(deployerAddress);
        console.log("Liquidity tokens distributed to deployer.");

        tokenDistributor.distributeTreasury(deployerAddress);
        console.log("Treasury tokens distributed to deployer.");

        vm.stopBroadcast();

        return (posumToken, tokenDistributor, teamVesting, rewardsDistributor);
    }
}

