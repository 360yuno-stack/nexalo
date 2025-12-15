// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AmbassadorRegistry
 * @dev Distribución automática de comisiones para embajadores (5%)
 */
contract AmbassadorRegistry is Ownable, ReentrancyGuard {
    
    IERC20 public immutable stablecoin;
    
    struct Ambassador {
        bool active;
        uint256 totalEarned;
        string name;
    }
    
    mapping(address => Ambassador) public ambassadors;
    address[] public ambassadorList;
    
    event AmbassadorRegistered(address indexed ambassador, string name);
    event FundsDistributed(uint256 totalAmount, uint256 ambassadorCount);
    
    constructor(address _stablecoin) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        stablecoin = IERC20(_stablecoin);
    }
    
    function registerAmbassador(address ambassador, string calldata name) external onlyOwner {
        require(ambassador != address(0), "Invalid address");
        require(!ambassadors[ambassador].active, "Already registered");
        
        ambassadors[ambassador] = Ambassador({
            active: true,
            totalEarned: 0,
            name: name
        });
        
        ambassadorList.push(ambassador);
        emit AmbassadorRegistered(ambassador, name);
    }
    
    function distributeFunds() external nonReentrant {
        uint256 balance = stablecoin.balanceOf(address(this));
        require(balance > 0, "No funds");
        
        uint256 activeCount = 0;
        for (uint256 i = 0; i < ambassadorList.length; i++) {
            if (ambassadors[ambassadorList[i]].active) {
                activeCount++;
            }
        }
        
        require(activeCount > 0, "No active ambassadors");
        
        uint256 amountPerAmbassador = balance / activeCount;
        
        for (uint256 i = 0; i < ambassadorList.length; i++) {
            address ambassador = ambassadorList[i];
            if (ambassadors[ambassador].active) {
                require(stablecoin.transfer(ambassador, amountPerAmbassador), "Transfer failed");
                ambassadors[ambassador].totalEarned += amountPerAmbassador;
            }
        }
        
        emit FundsDistributed(balance, activeCount);
    }
    
    function getActiveAmbassadorCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < ambassadorList.length; i++) {
            if (ambassadors[ambassadorList[i]].active) {
                count++;
            }
        }
        return count;
    }
}
