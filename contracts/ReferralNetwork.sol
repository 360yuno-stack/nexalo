// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * Red de referidos (5/3/2) con pagos pull.
 */
contract ReferralNetwork is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;
    address public nexumManager;

    mapping(address => address) public referrerOf;
    mapping(address => uint256) public claimable;

    event NexumManagerSet(address indexed manager);
    event ReferrerSet(address indexed user, address indexed referrer);
    event CommissionsAccrued(address indexed buyer, uint256 budget, address l1, address l2, address l3, uint256 paidTotal);
    event Claimed(address indexed user, uint256 amount);

    modifier onlyNexumManager() {
        require(msg.sender == nexumManager, "Only NexumManager");
        _;
    }

    constructor(address _stablecoin) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        stablecoin = IERC20(_stablecoin);
    }

    function setNexumManager(address _nexumManager) external onlyOwner {
        require(nexumManager == address(0), "Already set");
        require(_nexumManager != address(0), "Invalid address");
        nexumManager = _nexumManager;
        emit NexumManagerSet(_nexumManager);
    }

    function hasReferrer(address user) external view returns (bool) {
        return referrerOf[user] != address(0);
    }

    function setReferrer(address user, address referrer) external onlyNexumManager {
        require(user != address(0), "Invalid user");
        require(referrer != address(0), "Invalid referrer");
        require(referrer != user, "Self ref");
        require(referrerOf[user] == address(0), "Already has referrer");
        // Anti-loop: verificar que user no sea ancestor de referrer (hasta 3 niveles)
        address check = referrer;
        for (uint256 i = 0; i < 3; i++) {
            check = referrerOf[check];
            if (check == address(0)) break;
            require(check != user, "Circular ref");
        }
        referrerOf[user] = referrer;
        emit ReferrerSet(user, referrer);
    }

    function getReferralChain(address user) external view returns (address l1, address l2, address l3) {
        l1 = referrerOf[user];
        l2 = l1 == address(0) ? address(0) : referrerOf[l1];
        l3 = l2 == address(0) ? address(0) : referrerOf[l2];
    }

    function distributeCommissions(address buyer, uint256 referralBudget) external onlyNexumManager nonReentrant {
        require(buyer != address(0), "Invalid buyer");
        require(referralBudget > 0, "Budget=0");

        // M-03 FIX: Verify balance BEFORE accruing to any referrer (CEI pattern)
        require(stablecoin.balanceOf(address(this)) >= referralBudget, "Insufficient referral funds");

        address l1 = referrerOf[buyer];
        address l2 = l1 == address(0) ? address(0) : referrerOf[l1];
        address l3 = l2 == address(0) ? address(0) : referrerOf[l2];

        uint256 paidTotal = 0;
        if (l1 != address(0)) { uint256 a1 = (referralBudget * 500) / 1000; claimable[l1] += a1; paidTotal += a1; }
        if (l2 != address(0)) { uint256 a2 = (referralBudget * 300) / 1000; claimable[l2] += a2; paidTotal += a2; }
        if (l3 != address(0)) { uint256 a3 = (referralBudget * 200) / 1000; claimable[l3] += a3; paidTotal += a3; }

        emit CommissionsAccrued(buyer, referralBudget, l1, l2, l3, paidTotal);
    }

    function claim() external nonReentrant {
        uint256 amt = claimable[msg.sender];
        require(amt > 0, "Nothing to claim");
        claimable[msg.sender] = 0;
        stablecoin.safeTransfer(msg.sender, amt);
        emit Claimed(msg.sender, amt);
    }
}
