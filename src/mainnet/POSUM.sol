// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title POSUM Token
 * @notice The official ERC20 token for the POSUM ecosystem.
 */
contract POSUM is ERC20Permit, Ownable {
    uint256 public constant TOTAL_SUPPLY = 200_000_000 * 1e18;

    constructor(address initialOwner)
        ERC20("POSUM", "POSUM")
        ERC20Permit("POSUM")
        Ownable(initialOwner)
    {
        _mint(initialOwner, TOTAL_SUPPLY);
    }
}

