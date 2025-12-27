// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * 5% ambassadors: pull payments, distributeFunds permissionless (delta balance).
 */
contract AmbassadorRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;

    struct Ambassador {
        bool active;
        uint256 totalClaimed;
        uint256 rewardDebtE18; // snapshot of accRewardPerActiveE18
        string name;
    }

    mapping(address => Ambassador) public ambassadors;
    uint256 public activeCount;

    uint256 public accRewardPerActiveE18;
    uint256 public lastBalance;

    event AmbassadorRegistered(address indexed ambassador, string name);
    event AmbassadorStatusChanged(address indexed ambassador, bool active);
    event FundsDistributed(uint256 newFunds, uint256 activeCount, uint256 accRewardPerActiveE18);
    event Claimed(address indexed ambassador, uint256 amount);

    constructor(address _stablecoin) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        stablecoin = IERC20(_stablecoin);
        lastBalance = stablecoin.balanceOf(address(this));
    }

    function selfRegister(string calldata name) external {
        require(bytes(name).length > 0 && bytes(name).length <= 64, "Invalid name");
        Ambassador storage a = ambassadors[msg.sender];
        require(bytes(a.name).length == 0, "Already registered");

        ambassadors[msg.sender] = Ambassador({
            active: true,
            totalClaimed: 0,
            rewardDebtE18: accRewardPerActiveE18,
            name: name
        });

        activeCount += 1;
        emit AmbassadorRegistered(msg.sender, name);
    }

    function setAmbassadorStatus(address ambassador, bool active) external onlyOwner nonReentrant {
        require(ambassador != address(0), "Invalid address");
        Ambassador storage a = ambassadors[ambassador];
        require(bytes(a.name).length > 0, "Not registered");
        if (a.active == active) return;

        // crystallize
        a.rewardDebtE18 = accRewardPerActiveE18;

        a.active = active;
        if (active) activeCount += 1;
        else activeCount -= 1;

        emit AmbassadorStatusChanged(ambassador, active);
    }

    function distributeFunds() external nonReentrant {
        uint256 bal = stablecoin.balanceOf(address(this));
        require(bal > lastBalance, "No new funds");
        require(activeCount > 0, "No active ambassadors");

        uint256 delta = bal - lastBalance;
        accRewardPerActiveE18 += (delta * 1e18) / activeCount;
        lastBalance = bal;

        emit FundsDistributed(delta, activeCount, accRewardPerActiveE18);
    }

    function pendingRewards(address ambassador) public view returns (uint256) {
        Ambassador memory a = ambassadors[ambassador];
        if (bytes(a.name).length == 0) return 0;
        if (accRewardPerActiveE18 <= a.rewardDebtE18) return 0;
        return (accRewardPerActiveE18 - a.rewardDebtE18) / 1e18;
    }

    function claim() external nonReentrant {
        Ambassador storage a = ambassadors[msg.sender];
        require(bytes(a.name).length > 0, "Not registered");

        uint256 amt = pendingRewards(msg.sender);
        require(amt > 0, "Nothing to claim");

        a.rewardDebtE18 = accRewardPerActiveE18;
        a.totalClaimed += amt;

        uint256 bal = stablecoin.balanceOf(address(this));
        require(bal >= amt, "Insufficient balance");
        lastBalance = bal - amt;

        stablecoin.safeTransfer(msg.sender, amt);
        emit Claimed(msg.sender, amt);
    }
}
