// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TokenDistributor (Testnet helper)
 * @notice Simple owner-only distributor to split initial POSUM supply to given addresses.
 * - Owner must have POSUM balance and must approve this contract to transferFrom, or transfer POSUM into this contract and call distributeFromThis.
 */
contract TokenDistributor is Ownable {
    IERC20 public immutable posum;

    event Distributed(address indexed to, uint256 amount);

    constructor(address _posum, address _owner) {
        require(_posum != address(0), "posum=0");
        posum = IERC20(_posum);
        transferOwnership(_owner);
    }

    // distribute by pulling from owner (owner must approve this contract earlier)
    function distributeFromOwner(address to, uint256 amount) external onlyOwner {
        require(posum.transferFrom(msg.sender, to, amount), "transferFrom failed");
        emit Distributed(to, amount);
    }

    // distribute from this contract's balance (owner first transfers tokens here)
    function distributeFromThis(address to, uint256 amount) external onlyOwner {
        require(posum.transfer(to, amount), "transfer failed");
        emit Distributed(to, amount);
    }
}
