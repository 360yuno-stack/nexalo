// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.20;

interface IYieldStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function withdrawAll() external returns (uint256 withdrawn);
    function totalAssets() external view returns (uint256);
    function harvest() external returns (uint256 gained);
    function stablecoin() external view returns (address);
    function treasury() external view returns (address);
}
