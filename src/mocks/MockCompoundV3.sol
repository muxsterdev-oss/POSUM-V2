// src/mocks/MockCompoundV3.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockCompoundV3 {
    using SafeERC20 for IERC20;
    
    // --- CORRECTED VARIABLE NAME ---
    IERC20 public immutable ASSET;

    constructor(address _assetAddress) {
        ASSET = IERC20(_assetAddress);
    }

    function supply(address _asset, uint _amount) external {
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
    }

    function balanceOf(address _account) external view returns (uint256) {
        return ASSET.balanceOf(_account);
    }
}