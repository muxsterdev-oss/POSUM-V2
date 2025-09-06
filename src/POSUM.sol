// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title POSUM Token
 * @author POSUM Protocol
 * @notice The official ERC20 token for the POSUM ecosystem.
 */
contract POSUM is ERC20, Ownable {
    /**
     * @notice The total number of POSUM tokens that will ever exist.
     */
    uint256 public constant TOTAL_SUPPLY = 200_000_000 * (10 ** 18);

    /**
     * @notice Mints the total supply to the contract deployer and sets ownership.
     * @param initialOwner The address that will receive the entire initial supply and own the contract.
     */
    constructor(address initialOwner) ERC20("POSUM", "POSUM") Ownable(initialOwner) {
        _mint(initialOwner, TOTAL_SUPPLY);
    }
}

