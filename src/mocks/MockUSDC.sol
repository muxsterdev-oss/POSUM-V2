// src/mocks/MockUSDC.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        // In modern OpenZeppelin, we override the function instead of calling a setup function.
    }

    // Override the decimals function to return 6, just like real USDC.
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    // Public mint function so anyone can get tokens for testing
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}