// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface INexumManagerBuy {
    function buyTickets(uint256 productId, uint256 quantity, address referrerAddr) external;
    function buySpecificTickets(uint256 productId, uint256[] calldata ticketNumbers, address referrerAddr) external;
}

contract MaliciousERC20Reenter is ERC20 {
    address public manager;
    bool public attackEnabled;
    uint256 public attackProduct;
    uint256 public attackQty;
    bool public useSpecific;
    uint256[] public specificTickets;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function setManager(address m) external {
        manager = m;
    }

    function mint(address to, uint256 amt) external {
        _mint(to, amt);
    }

    function configureAttackBuy(uint256 productId, uint256 qty) external {
        attackProduct = productId;
        attackQty = qty;
        useSpecific = false;
        delete specificTickets;
    }

    function configureAttackSpecific(uint256 productId, uint256[] calldata tickets) external {
        attackProduct = productId;
        attackQty = uint256(tickets.length);
        useSpecific = true;
        delete specificTickets;
        for (uint256 i = 0; i < tickets.length; i++) {
            specificTickets.push(tickets[i]);
        }
    }

    function setAttackEnabled(bool on) external {
        attackEnabled = on;
    }

    // Reentrancy attempt: when manager calls transferFrom during buy,
    // we try to reenter manager.buyTickets/buySpecificTickets.
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (attackEnabled && msg.sender == manager) {
            // disable first to avoid infinite loop
            attackEnabled = false;

            if (useSpecific) {
                INexumManagerBuy(manager).buySpecificTickets(attackProduct, specificTickets, address(0));
            } else {
                INexumManagerBuy(manager).buyTickets(attackProduct, attackQty, address(0));
            }
        }

        return super.transferFrom(from, to, amount);
    }
}
