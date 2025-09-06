// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PositivePoolVault (MVP)
 * @notice Minimal flexible vault for an ERC20 asset (USDC/WETH).
 * - Deposits transfer asset into vault.
 * - Vault keeps simple shares = assets (1:1) for MVP.
 * - On deposit/withdraw, vault calls SUMPoints.awardPoints for user.
 * - Comet integration left as placeholder for future mainnet wiring.
 */
contract PositivePoolVault is Ownable {
    IERC20 public immutable asset;
    uint8 public immutable assetDecimals;
    address public immutable sumPoints; // SUMPoints contract
    uint256 public totalShares;
    mapping(address => uint256) public sharesOf;

    // simple multiplier for SUM points (points per asset unit scaled to 18d)
    uint256 public sumMultiplier = 1; // 1 SUM per $1-equivalent (approx)

    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event SetSumMultiplier(uint256 m);

    constructor(address _asset, address _sumPoints) {
        require(_asset != address(0) && _sumPoints != address(0), "zero");
        asset = IERC20(_asset);
        sumPoints = _sumPoints;
        assetDecimals = IERC20Metadata(_asset).decimals();
    }

    // deposit `amount` of ERC20 asset
    function deposit(uint256 amount) external {
        require(amount > 0, "amount=0");
        // transfer asset in
        require(asset.transferFrom(msg.sender, address(this), amount), "transferFrom failed");

        // mint shares 1:1 for MVP
        uint256 minted = amount;
        totalShares += minted;
        sharesOf[msg.sender] += minted;

        // award SUM points: normalize amount to 18 decimals
        uint256 normalized = _to18(amount, assetDecimals);
        uint256 points = (normalized * sumMultiplier) / 1e18;
        if (points > 0) {
            // call SUMPoints.awardPoints
            (bool ok, ) = sumPoints.call(abi.encodeWithSignature("awardPoints(address,uint256)", msg.sender, points));
            require(ok, "sumPoints award failed");
        }

        emit Deposit(msg.sender, amount, minted);
    }

    function withdraw(uint256 shareAmount) external {
        require(shareAmount > 0 && sharesOf[msg.sender] >= shareAmount, "bad shares");
        // burn shares
        sharesOf[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        // transfer underlying asset
        require(asset.transfer(msg.sender, shareAmount), "asset transfer failed");

        emit Withdraw(msg.sender, shareAmount, shareAmount);
    }

    function setSumMultiplier(uint256 _m) external onlyOwner {
        sumMultiplier = _m;
        emit SetSumMultiplier(_m);
    }

    // helper to normalize to 18 decimals
    function _to18(uint256 amt, uint8 dec) internal pure returns (uint256) {
        if (dec == 18) return amt;
        if (dec < 18) return amt * (10 ** (18 - dec));
        return amt / (10 ** (dec - 18));
    }
}

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}
