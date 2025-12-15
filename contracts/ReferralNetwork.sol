// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReferralNetwork
 * @dev Sistema multinivel 3 niveles (5% + 3% + 2%)
 */
contract ReferralNetwork is Ownable, ReentrancyGuard {
    
    IERC20 public immutable stablecoin;
    
    // Niveles (base 10000 = 100%)
    uint256 public constant LEVEL1_PCT = 5000; // 50% del 10% = 5%
    uint256 public constant LEVEL2_PCT = 3000; // 30% del 10% = 3%
    uint256 public constant LEVEL3_PCT = 2000; // 20% del 10% = 2%
    
    mapping(address => address) public referrer;
    mapping(address => uint256) public totalEarned;
    mapping(address => address[]) public directReferrals;
    
    address public nexumManager;
    
    event ReferrerSet(address indexed user, address indexed referrer);
    event CommissionPaid(address indexed referrer, address indexed buyer, uint256 level, uint256 amount);
    
    constructor(address _stablecoin) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        stablecoin = IERC20(_stablecoin);
    }
    
    function setNexumManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid manager");
        require(nexumManager == address(0), "Already set");
        nexumManager = _manager;
    }
    
    modifier onlyManager() {
        require(msg.sender == nexumManager, "Only manager");
        _;
    }
    
    function setReferrer(address user, address _referrer) external onlyManager {
        require(user != address(0) && _referrer != address(0), "Invalid addresses");
        require(user != _referrer, "Cannot refer yourself");
        require(referrer[user] == address(0), "Already has referrer");
        
        // Evitar ciclos
        address current = _referrer;
        for (uint256 i = 0; i < 3; i++) {
            if (current == address(0)) break;
            require(current != user, "Referral cycle");
            current = referrer[current];
        }
        
        referrer[user] = _referrer;
        directReferrals[_referrer].push(user);
        
        emit ReferrerSet(user, _referrer);
    }
    
    function distributeCommissions(address buyer, uint256 totalAmount) external onlyManager nonReentrant {
        require(totalAmount > 0, "Invalid amount");
        
        address level1 = referrer[buyer];
        if (level1 != address(0)) {
            uint256 amount1 = (totalAmount * LEVEL1_PCT) / 10000;
            if (amount1 > 0) {
                require(stablecoin.transfer(level1, amount1), "Transfer failed");
                totalEarned[level1] += amount1;
                emit CommissionPaid(level1, buyer, 1, amount1);
            }
        }
        
        address level2 = level1 != address(0) ? referrer[level1] : address(0);
        if (level2 != address(0)) {
            uint256 amount2 = (totalAmount * LEVEL2_PCT) / 10000;
            if (amount2 > 0) {
                require(stablecoin.transfer(level2, amount2), "Transfer failed");
                totalEarned[level2] += amount2;
                emit CommissionPaid(level2, buyer, 2, amount2);
            }
        }
        
        address level3 = level2 != address(0) ? referrer[level2] : address(0);
        if (level3 != address(0)) {
            uint256 amount3 = (totalAmount * LEVEL3_PCT) / 10000;
            if (amount3 > 0) {
                require(stablecoin.transfer(level3, amount3), "Transfer failed");
                totalEarned[level3] += amount3;
                emit CommissionPaid(level3, buyer, 3, amount3);
            }
        }
    }
    
    function hasReferrer(address user) external view returns (bool) {
        return referrer[user] != address(0);
    }
    
    function getReferralChain(address user) external view returns (
        address level1,
        address level2,
        address level3
    ) {
        level1 = referrer[user];
        level2 = level1 != address(0) ? referrer[level1] : address(0);
        level3 = level2 != address(0) ? referrer[level2] : address(0);
    }
}
