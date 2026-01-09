// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface INexumManager {
    function buyTickets(uint256 productId, uint256 quantity, address referrerAddr) external;
}

contract MaliciousUSDT is ERC20 {
    INexumManager public manager;
    bool public attackEnabled;
    bool private inTransfer;

    uint256 public attackProductId;
    uint256 public attackQty;
    address public attackReferrer;

    constructor() ERC20("Malicious USDT", "mUSDT") {}

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function setManager(address _manager) external {
        manager = INexumManager(_manager);
    }

    function configureAttack(uint256 productId, uint256 qty, address referrer) external {
        attackProductId = productId;
        attackQty = qty;
        attackReferrer = referrer;
    }

    function setAttackEnabled(bool enabled) external {
        attackEnabled = enabled;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // Reentrancy happens here: manager.buyTickets -> stablecoin.transferFrom -> calls back manager.buyTickets
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (attackEnabled && !inTransfer && address(manager) != address(0)) {
            inTransfer = true;

            // Try to reenter NexumManager during transferFrom
            // If NexumManager has nonReentrant, this should revert the whole tx.
            manager.buyTickets(attackProductId, attackQty, attackReferrer);

            inTransfer = false;
        }
        return super.transferFrom(from, to, amount);
    }
}
