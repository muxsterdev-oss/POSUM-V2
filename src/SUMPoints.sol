// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SUMPoints
 * @notice Proof-of-loyalty points system for POSUM ecosystem.
 * @dev Not a token, not transferable. Internal accounting only.
 */
contract SUMPoints is Ownable {
    // --- State ---
    mapping(address => uint256) public points;      // user => current season points
    uint256 public currentSeason;                   // season ID
    mapping(uint256 => mapping(address => uint256)) public seasonPoints; // season => user => points
    mapping(address => bool) public authorized;     // contracts allowed to award points

    // --- Events ---
    event PointsAwarded(address indexed user, uint256 amount, uint256 season);
    event PointsDeducted(address indexed user, uint256 amount, uint256 season);
    event SeasonReset(uint256 newSeason);
    event AuthorizedContract(address indexed contractAddr, bool status);

    constructor(address initialOwner) Ownable(initialOwner) {
        currentSeason = 1; // start with season 1
    }

    // --- Modifiers ---
    modifier onlyAuthorized() {
        require(authorized[msg.sender], "SUMPoints: not authorized");
        _;
    }

    // --- Core Functions ---

    /// @notice Award points to a user
    function awardPoints(address user, uint256 amount) external onlyAuthorized {
        points[user] += amount;
        seasonPoints[currentSeason][user] += amount;
        emit PointsAwarded(user, amount, currentSeason);
    }

    /// @notice Deduct points from a user
    function deductPoints(address user, uint256 amount) external onlyAuthorized {
        require(points[user] >= amount, "SUMPoints: insufficient points");
        points[user] -= amount;
        seasonPoints[currentSeason][user] -= amount;
        emit PointsDeducted(user, amount, currentSeason);
    }

    /// @notice Reset all balances and start a new season
    function resetSeason() external onlyOwner {
        currentSeason++;
        emit SeasonReset(currentSeason);
    }

    // --- Admin Functions ---
    function setAuthorized(address contractAddr, bool status) external onlyOwner {
        authorized[contractAddr] = status;
        emit AuthorizedContract(contractAddr, status);
    }

    // --- Views ---
    function getPoints(address user) external view returns (uint256) {
        return points[user];
    }

    function getSeasonPoints(address user, uint256 season) external view returns (uint256) {
        return seasonPoints[season][user];
    }
}
