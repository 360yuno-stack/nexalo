// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDT
 * @dev Stablecoin de prueba para NEXALO en testnet (solo para tests).
 */
contract TestUSDT is ERC20, Ownable {
    constructor() ERC20("Test USDT", "tUSDT") Ownable(msg.sender) {
        // Opcional: mintear algo inicial al deployer
        _mint(msg.sender, 10_000_000 * 10**decimals());
    }

    /**
     * @dev Mint manual para pruebas. Solo el owner puede llamar.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
