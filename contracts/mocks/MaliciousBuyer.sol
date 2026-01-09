// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface INexumManager {
    function buyTickets(uint256 productId, uint256 quantity, address referrer) external;
    function claimStable() external;
    function resolveStuckRound(uint256 productId, uint256 roundId) external;
}

interface IERC20Like {
    function approve(address spender, uint256 amount) external returns (bool);
}

contract MaliciousBuyer {
    INexumManager public manager;
    IERC20Like public stable;
    bool public attackReenterBuy;
    bool public attackReenterClaim;

    uint256 public productId;
    uint256 public qty;
    address public referrer;

    constructor(address _manager, address _stable) {
        manager = INexumManager(_manager);
        stable = IERC20Like(_stable);
    }

    function setAttackMode(bool reenterBuy, bool reenterClaim) external {
        attackReenterBuy = reenterBuy;
        attackReenterClaim = reenterClaim;
    }

    function configure(uint256 _productId, uint256 _qty, address _referrer) external {
        productId = _productId;
        qty = _qty;
        referrer = _referrer;
    }

    function approveStable(uint256 amount) external {
        stable.approve(address(manager), amount);
    }

    function startBuy() external {
        manager.buyTickets(productId, qty, referrer);
    }

    function startClaim() external {
        manager.claimStable();
    }

    // Si el Manager te manda ETH por error o si algún flujo hace callback,
    // probamos reentrancia. Si el Manager está bien con nonReentrant,
    // esto no debe drenar nada ni romper el estado.
    receive() external payable {
        if (attackReenterBuy) {
            // intenta reentrar (debe fallar o no afectar)
            try manager.buyTickets(productId, 1, referrer) {} catch {}
        }
        if (attackReenterClaim) {
            try manager.claimStable() {} catch {}
        }
    }
}
