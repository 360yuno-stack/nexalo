// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BuybackContract
 * @dev Acumulación de fondos para buyback de NXL (2% de operaciones)
 */
contract BuybackContract is Ownable {
    
    IERC20 public immutable stablecoin;
    IERC20 public immutable nxlToken;
    
    uint256 public totalReceived;
    uint256 public totalBuyback;
    
    event FundsReceived(uint256 amount);
    event BuybackExecuted(uint256 amount);
    
    constructor(address _stablecoin, address _nxlToken) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_nxlToken != address(0), "Invalid NXL");
        stablecoin = IERC20(_stablecoin);
        nxlToken = IERC20(_nxlToken);
    }
    
    receive() external payable {
        totalReceived += msg.value;
        emit FundsReceived(msg.value);
    }
    
    function recordDeposit(uint256 amount) external {
        totalReceived += amount;
        emit FundsReceived(amount);
    }
    
    function executeBuyback(uint256 stableAmount) external onlyOwner {
        require(stablecoin.balanceOf(address(this)) >= stableAmount, "Insufficient balance");
        totalBuyback += stableAmount;
        emit BuybackExecuted(stableAmount);
    }
    
    function getBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }
}
