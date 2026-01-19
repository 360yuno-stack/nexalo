// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IYieldStrategy.sol";

contract MockStrategy is IYieldStrategy {
    IERC20 public immutable _stablecoin;
    address public immutable _treasury;

    uint256 public totalAssetsMock;

    constructor(address stablecoin_, address treasury_) {
        _stablecoin = IERC20(stablecoin_);
        _treasury = treasury_;
    }

    function stablecoin() external view returns (address) {
        return address(_stablecoin);
    }

    function treasury() external view returns (address) {
        return _treasury;
    }

    function deposit(uint256 amount) external {
        _stablecoin.transferFrom(msg.sender, address(this), amount);
        totalAssetsMock += amount;
    }

    function withdraw(uint256 amount) external {
        require(totalAssetsMock >= amount, "Insufficient strategy funds");
        totalAssetsMock -= amount;
        _stablecoin.transfer(msg.sender, amount);
    }

    function withdrawAll() external returns (uint256) {
        uint256 amount = totalAssetsMock;
        totalAssetsMock = 0;
        _stablecoin.transfer(msg.sender, amount);
        return amount;
    }

    function harvest() external pure returns (uint256) {
        return 0; // Simplified
    }

    function totalAssets() external view returns (uint256) {
        return totalAssetsMock;
    }
}
