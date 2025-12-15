// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DonationVault
 * @dev Vault para donaciones públicas que van directo a liquidez de staking BTC
 * 
 * CARACTERÍSTICAS:
 * - Acepta donaciones en stablecoin
 * - Registro público de donantes
 * - Transferencia automática a TreasuryBTC
 * - Transparencia total
 */
contract DonationVault is Ownable, ReentrancyGuard {
    
    IERC20 public immutable stablecoin;
    address public treasuryBTC;
    
    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
    }
    
    // Registro de donaciones
    Donation[] public donations;
    mapping(address => uint256) public totalDonated;
    mapping(address => uint256[]) public donorDonations; // donor => donation IDs
    
    uint256 public totalReceived;
    uint256 public totalDonors;
    
    // Eventos
    event DonationReceived(
        address indexed donor,
        uint256 amount,
        uint256 donationId,
        string message
    );
    event DonationsForwarded(address indexed treasury, uint256 amount);
    
    constructor(
        address _stablecoin,
        address _treasuryBTC
    ) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_treasuryBTC != address(0), "Invalid treasury");
        
        stablecoin = IERC20(_stablecoin);
        treasuryBTC = _treasuryBTC;
    }
    
    /**
     * @dev Recibir donación con mensaje opcional
     */
    function donate(uint256 amount, string calldata message) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(bytes(message).length <= 280, "Message too long");
        
        require(
            stablecoin.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Registrar donación
        uint256 donationId = donations.length;
        donations.push(Donation({
            donor: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            message: message
        }));
        
        donorDonations[msg.sender].push(donationId);
        
        if (totalDonated[msg.sender] == 0) {
            totalDonors++;
        }
        
        totalDonated[msg.sender] += amount;
        totalReceived += amount;
        
        emit DonationReceived(msg.sender, amount, donationId, message);
        
        // Enviar automáticamente a TreasuryBTC
        _forwardToTreasury(amount);
    }
    
    /**
     * @dev Enviar fondos a TreasuryBTC automáticamente
     */
    function _forwardToTreasury(uint256 amount) private {
        require(
            stablecoin.transfer(treasuryBTC, amount),
            "Forward failed"
        );
        
        emit DonationsForwarded(treasuryBTC, amount);
    }
    
    // ========== VISTAS ==========
    
    /**
     * @dev Obtener lista de donaciones recientes
     */
    function getRecentDonations(uint256 limit) external view returns (
        address[] memory donors,
        uint256[] memory amounts,
        uint256[] memory timestamps,
        string[] memory messages
    ) {
        uint256 count = limit > donations.length ? donations.length : limit;
        
        donors = new address[](count);
        amounts = new uint256[](count);
        timestamps = new uint256[](count);
        messages = new string[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 index = donations.length - 1 - i;
            Donation memory donation = donations[index];
            
            donors[i] = donation.donor;
            amounts[i] = donation.amount;
            timestamps[i] = donation.timestamp;
            messages[i] = donation.message;
        }
        
        return (donors, amounts, timestamps, messages);
    }
    
    /**
     * @dev Obtener todas las donaciones de un donor
     */
    function getDonorDonations(address donor) external view returns (
        uint256[] memory donationIds,
        uint256[] memory amounts,
        uint256[] memory timestamps
    ) {
        uint256[] memory ids = donorDonations[donor];
        uint256 count = ids.length;
        
        amounts = new uint256[](count);
        timestamps = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            Donation memory donation = donations[ids[i]];
            amounts[i] = donation.amount;
            timestamps[i] = donation.timestamp;
        }
        
        return (ids, amounts, timestamps);
    }
    
    /**
     * @dev Top donadores
     */
    function getTopDonors(uint256 limit) external view returns (
        address[] memory topDonors,
        uint256[] memory amounts
    ) {
        uint256 count = limit > totalDonors ? totalDonors : limit;
        topDonors = new address[](count);
        amounts = new uint256[](count);
        
        // Obtener todos los donadores únicos
        address[] memory allDonors = new address[](donations.length);
        uint256 uniqueCount = 0;
        
        for (uint256 i = 0; i < donations.length; i++) {
            address donor = donations[i].donor;
            bool found = false;
            
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (allDonors[j] == donor) {
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                allDonors[uniqueCount] = donor;
                uniqueCount++;
            }
        }
        
        // Ordenar por monto donado
        for (uint256 i = 0; i < count && i < uniqueCount; i++) {
            uint256 maxAmount = 0;
            address maxDonor = address(0);
            
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (totalDonated[allDonors[j]] > maxAmount) {
                    bool alreadyAdded = false;
                    for (uint256 k = 0; k < i; k++) {
                        if (topDonors[k] == allDonors[j]) {
                            alreadyAdded = true;
                            break;
                        }
                    }
                    if (!alreadyAdded) {
                        maxAmount = totalDonated[allDonors[j]];
                        maxDonor = allDonors[j];
                    }
                }
            }
            
            if (maxDonor != address(0)) {
                topDonors[i] = maxDonor;
                amounts[i] = maxAmount;
            }
        }
        
        return (topDonors, amounts);
    }
    
    /**
     * @dev Estadísticas globales
     */
    function getStats() external view returns (
        uint256 _totalReceived,
        uint256 _totalDonors,
        uint256 _totalDonations
    ) {
        return (totalReceived, totalDonors, donations.length);
    }
    
    /**
     * @dev Información de un donador específico
     */
    function getDonorInfo(address donor) external view returns (
        uint256 _totalDonated,
        uint256 _donationCount,
        uint256 _lastDonationTime
    ) {
        uint256[] memory ids = donorDonations[donor];
        uint256 lastTime = 0;
        
        if (ids.length > 0) {
            lastTime = donations[ids[ids.length - 1]].timestamp;
        }
        
        return (totalDonated[donor], ids.length, lastTime);
    }
    
    // ========== ADMIN ==========
    
    /**
     * @dev Actualizar dirección de TreasuryBTC
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        treasuryBTC = newTreasury;
    }
    
    /**
     * @dev Recuperar tokens enviados por error
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(stablecoin), "Cannot recover stablecoin");
        IERC20(token).transfer(owner(), amount);
    }
}
