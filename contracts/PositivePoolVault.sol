// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract PositivePoolVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable asset;
    IERC20 public immutable aToken;
    IAavePool public constant AAVE_POOL = IAavePool(0x46e6b214b524310239732D51387075E0e70970bf);
    uint256 public immutable lockDuration;
    uint16 public constant FLEX_MULTIPLIER = 100;
    uint16 public constant LOCKED_MULTIPLIER = 150;
    uint256 public totalFlexShares;
    uint256 public totalLockedShares;
    mapping(address => uint256) public userFlexShares;
    mapping(address => uint256) public userLockedShares;
    mapping(address => uint256) public userLockEndDate;
    mapping(address => uint256) public userSumPoints;
    mapping(address => uint256) private userLastPointUpdateTime;
    event Deposited(address indexed user, uint256 amount, uint256 sharesIssued, bool isLocked);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event LockConverted(address indexed user, uint256 shares);
    event LockExtended(address indexed user, uint256 newEndDate);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    constructor(
        address initialOwner,
        address _assetAddress,
        address _aTokenAddress,
        uint256 _lockDurationSeconds
    ) Ownable(initialOwner) {
        require(_assetAddress != address(0) && _aTokenAddress != address(0), "Invalid address");
        asset = IERC20(_assetAddress);
        aToken = IERC20(_aTokenAddress);
        lockDuration = _lockDurationSeconds;
    }

    function deposit(uint256 _amount, bool _isLocked) external nonReentrant {
        require(_amount > 0, "Deposit must be > 0");
        _updatePoints(msg.sender);
        uint256 sharesToIssue = previewDeposit(_amount);
        require(sharesToIssue > 0, "Amount too small");
        if (_isLocked) {
            totalLockedShares += sharesToIssue;
            userLockedShares[msg.sender] += sharesToIssue;
            uint256 newLockEndDate;
            if (block.timestamp > userLockEndDate[msg.sender]) {
                newLockEndDate = block.timestamp + lockDuration;
            } else {
                newLockEndDate = userLockEndDate[msg.sender] + lockDuration;
            }
            userLockEndDate[msg.sender] = newLockEndDate;
            emit LockExtended(msg.sender, newLockEndDate);
        } else {
            totalFlexShares += sharesToIssue;
            userFlexShares[msg.sender] += sharesToIssue;
        }
        _transferAndSupplyToAave(msg.sender, _amount);
        emit Deposited(msg.sender, _amount, sharesToIssue, _isLocked);
    }

    function withdraw(uint256 _shares) external nonReentrant {
        require(_shares > 0, "Must withdraw > 0 shares");
        uint256 userFlexShareBalance = userFlexShares[msg.sender];
        require(_shares <= userFlexShareBalance, "Insufficient flexible shares");
        _withdrawLogic(msg.sender, _shares);
    }
    
    function withdrawMax() external nonReentrant {
        _convertExpiredLock(msg.sender);
        uint256 userFlexShareBalance = userFlexShares[msg.sender];
        require(userFlexShareBalance > 0, "No flexible shares to withdraw");
        _withdrawLogic(msg.sender, userFlexShareBalance);
    }

    function convertExpiredLock(address _user) public nonReentrant {
        _convertExpiredLock(_user);
    }
    
    function rescueTokens(address _tokenAddress, address _to, uint256 _amount) external onlyOwner {
        require(_tokenAddress != address(asset) && _tokenAddress != address(aToken), "Cannot rescue pool assets");
        IERC20(_tokenAddress).safeTransfer(_to, _amount);
        emit TokenRescued(_tokenAddress, _to, _amount);
    }
    
    function _withdrawLogic(address _user, uint256 _shares) private {
        _updatePoints(_user);
        uint256 amountToWithdraw = previewWithdraw(_shares);
        userFlexShares[_user] -= _shares;
        totalFlexShares -= _shares;
        uint256 actualWithdrawnAmount = AAVE_POOL.withdraw(address(asset), amountToWithdraw, address(this));
        require(actualWithdrawnAmount > 0, "Aave withdraw failed");
        asset.safeTransfer(_user, actualWithdrawnAmount);
        emit Withdrawn(_user, actualWithdrawnAmount, _shares);
    }
    
    function _convertExpiredLock(address _user) private {
        uint256 lockEndDate = userLockEndDate[_user];
        if (lockEndDate > 0 && block.timestamp >= lockEndDate) {
            _updatePoints(_user);
            uint256 sharesToConvert = userLockedShares[_user];
            if (sharesToConvert > 0) {
                userLockedShares[_user] = 0;
                totalLockedShares -= sharesToConvert;
                userFlexShares[_user] += sharesToConvert;
                totalFlexShares += sharesToConvert;
                userLockEndDate[_user] = 0;
                emit LockConverted(_user, sharesToConvert);
            }
        }
    }

    function _transferAndSupplyToAave(address _from, uint256 _amount) private {
        asset.safeTransferFrom(_from, address(this), _amount);
        asset.safeApprove(address(AAVE_POOL), 0);
        asset.safeApprove(address(AAVE_POOL), _amount);
        AAVE_POOL.supply(address(asset), _amount, address(this), 0);
    }

    function _updatePoints(address _user) private {
        uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
        if (timeElapsed > 0) {
            uint256 flexPoints = (userFlexShares[_user] * timeElapsed * FLEX_MULTIPLIER) / 100;
            uint256 lockedPoints = (userLockedShares[_user] * timeElapsed * LOCKED_MULTIPLIER) / 100;
            userSumPoints[_user] += flexPoints + lockedPoints;
        }
        userLastPointUpdateTime[_user] = block.timestamp;
    }
    
    function getContractValue() public view returns (uint256) {
        return aToken.balanceOf(address(this)) + asset.balanceOf(address(this));
    }

    function previewDeposit(uint256 _amount) public view returns (uint256 shares) {
        uint256 totalAssetValue = getContractValue();
        uint256 _totalShares = totalFlexShares + totalLockedShares;
        if (_totalShares == 0) {
            require(totalAssetValue == 0, "Initial deposit mispricing");
            return _amount;
        }
        return (_amount * _totalShares) / totalAssetValue;
    }

    function previewWithdraw(uint256 _shares) public view returns (uint256 amount) {
        uint256 _totalShares = totalFlexShares + totalLockedShares;
        if (_totalShares == 0) return 0;
        return (_shares * getContractValue()) / _totalShares;
    }

    function getCurrentSumPoints(address _user) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - userLastPointUpdateTime[_user];
        if (timeElapsed == 0) return userSumPoints[_user];
        uint256 flexPoints = (userFlexShares[_user] * timeElapsed * FLEX_MULTIPLIER) / 100;
        uint256 lockedPoints = (userLockedShares[_user] * timeElapsed * LOCKED_MULTIPLIER) / 100;
        return userSumPoints[_user] + flexPoints + lockedPoints;
    }
}