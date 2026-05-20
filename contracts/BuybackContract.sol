// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BuybackContract
 * @author Nexalo Team
 * @dev Vault de acumulación para buyback de NXL.
 */
contract BuybackContract is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;
    IERC20 public immutable nxlToken;

    uint256 public totalReceived;
    uint256 public totalSpent;

    event FundsReceived(address indexed from, uint256 amount);
    event FundsSpent(address indexed to, uint256 amount);

    constructor(address _stablecoin, address _nxlToken) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_nxlToken != address(0), "Invalid NXL");
        stablecoin = IERC20(_stablecoin);
        nxlToken = IERC20(_nxlToken);
    }

    function receiveFunds() external nonReentrant {
        uint256 bal = stablecoin.balanceOf(address(this));
        uint256 accounted = totalReceived - totalSpent; // totalSpent nunca debería superar totalReceived
        require(bal >= accounted + 1, "No new funds");

        uint256 delta = bal - accounted;
        totalReceived += delta;

        emit FundsReceived(msg.sender, delta);
    }

    function spend(address to, uint256 amount) external nonReentrant onlyOwner {
        require(to != address(0), "Invalid to");
        require(amount != 0, "Amount must be > 0");
        require(stablecoin.balanceOf(address(this)) >= amount, "Insufficient balance");

        totalSpent += amount;
        stablecoin.safeTransfer(to, amount);

        emit FundsSpent(to, amount);
    }

    function getBalance() external view returns (uint256) {
        return stablecoin.balanceOf(address(this));
    }
}
