// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IYieldStrategy.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


/**
 * @notice STUB — NOT FOR PRODUCTION USE. DO NOT DEPLOY TO MAINNET.
 * @dev This contract is a placeholder for audit/testing purposes only.
 * In production: integrate Venus vToken mint/redeemUnderlying with proper safety checks.
 */
contract VenusStrategy is IYieldStrategy, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Safety flag: prevents mainnet deployment of this stub.
    bool private constant _IS_PRODUCTION_READY = false;

    IERC20 private immutable _stable;
    address private immutable _treasury;

    uint256 private _managed;

    modifier onlyTreasury() {
        require(msg.sender == _treasury, "Only TreasuryBTC");
        _;
    }

    modifier notProduction() {
        require(!_IS_PRODUCTION_READY, "STUB: NOT FOR PRODUCTION - deploy real Venus integration");
        _;
    }

    constructor(address stable_, address treasury_) {
        require(stable_ != address(0), "Invalid stablecoin");
        require(treasury_ != address(0), "Invalid treasury");
        _stable = IERC20(stable_);
        _treasury = treasury_;
    }

    function stablecoin() external view override returns (address) { return address(_stable); }
    function treasury() external view override returns (address) { return _treasury; }

    function deposit(uint256 amount) external override onlyTreasury nonReentrant notProduction {
        require(amount > 0, "Amount=0");
        _stable.safeTransferFrom(_treasury, address(this), amount);
        _managed += amount;
    }

    function withdraw(uint256 amount) external override onlyTreasury nonReentrant notProduction {
        require(amount > 0, "Amount=0");
        require(_managed >= amount, "Insufficient managed");
        _managed -= amount;
        _stable.safeTransfer(_treasury, amount);
    }

    function withdrawAll() external override onlyTreasury nonReentrant notProduction returns (uint256 withdrawn) {
        uint256 bal = _stable.balanceOf(address(this));
        withdrawn = bal;
        _managed = 0;
        if (bal > 0) _stable.safeTransfer(_treasury, bal);
    }

    function harvest() external override onlyTreasury nonReentrant notProduction returns (uint256 gained) {
        return 0;
    }

    function totalAssets() external view override returns (uint256) {
        return _stable.balanceOf(address(this));
    }
}
