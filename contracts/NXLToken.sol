// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NXLToken
 * @notice Token ERC20 con sistema de rewards y vesting
 * @dev Supply total: 100M NXL
 *      - 96M para rewards (96%) - quedan en el contrato
 *      - 3M para Founder con vesting 2 años (3%)
 *      - 1M para Partner con vesting 1 año (1%)
 */
contract NXLToken is ERC20, Ownable {

    // ═════════════════════════════════════════════════════════
    // CONSTANTES
    // ═════════════════════════════════════════════════════════

    uint256 private constant TOTAL_SUPPLY = 100_000_000 * 10**18;        // 100M
    uint256 private constant REWARDS_POOL_AMOUNT = 96_000_000 * 10**18;  // 96M
    uint256 private constant FOUNDER_AMOUNT = 3_000_000 * 10**18;        // 3M
    uint256 private constant PARTNER_AMOUNT = 1_000_000 * 10**18;        // 1M

    uint256 private constant FOUNDER_VESTING_DURATION = 730 days;  // 2 años
    uint256 private constant PARTNER_VESTING_DURATION = 365 days;  // 1 año

    // ═════════════════════════════════════════════════════════
    // VARIABLES DE ESTADO
    // ═════════════════════════════════════════════════════════

    address public immutable founderAddress;
    address public immutable partnerAddress;
    address public nexumManager;

    uint256 public immutable deploymentTime;
    uint256 public immutable founderVestingEnd;
    uint256 public immutable partnerVestingEnd;

    uint256 public founderWithdrawn;
    uint256 public partnerWithdrawn;
    uint256 public rewardsDistributed;

    bool public nexumManagerSet;

    // ═════════════════════════════════════════════════════════
    // EVENTOS
    // ═════════════════════════════════════════════════════════

    event RewardDistributed(address indexed recipient, uint256 amount);
    event VestedTokensWithdrawn(address indexed beneficiary, uint256 amount);
    event NexumManagerSet(address indexed manager);
    event TokensBurned(uint256 amount);

    // ═════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═════════════════════════════════════════════════════════

    constructor(
        address _founderAddress,
        address _partnerAddress
    ) ERC20("NEXALO Token", "NXL") Ownable(msg.sender) {
        require(_founderAddress != address(0), "Invalid founder address");
        require(_partnerAddress != address(0), "Invalid partner address");

        founderAddress = _founderAddress;
        partnerAddress = _partnerAddress;

        deploymentTime = block.timestamp;
        founderVestingEnd = block.timestamp + FOUNDER_VESTING_DURATION;
        partnerVestingEnd = block.timestamp + PARTNER_VESTING_DURATION;

        // Mintear supply total al contrato
        // 100M total: 96M rewards + 3M founder + 1M partner
        _mint(address(this), TOTAL_SUPPLY);
    }

    // ═════════════════════════════════════════════════════════
    // CONFIGURACIÓN
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Establece la dirección del NexumManager (una sola vez)
     * @dev Solo puede llamarse una vez por el owner
     */
    function setNexumManager(address _nexumManager) external onlyOwner {
        require(!nexumManagerSet, "NexumManager already set");
        require(_nexumManager != address(0), "Invalid address");

        nexumManager = _nexumManager;
        nexumManagerSet = true;

        emit NexumManagerSet(_nexumManager);
    }

    // ═════════════════════════════════════════════════════════
    // DISTRIBUCIÓN DE REWARDS
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Distribuye rewards NXL desde el pool de rewards del contrato
     * @dev Solo puede ser llamado por el NexumManager
     *      Los tokens se transfieren directamente desde el contrato
     * @param recipient Dirección del destinatario
     * @param amount Cantidad de NXL a distribuir
     */
    function distributeReward(address recipient, uint256 amount) external {
        require(msg.sender == nexumManager, "Only NexumManager");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");

        // Verificar que hay suficientes tokens disponibles en rewards
        uint256 availableRewards = getAvailableRewards();
        require(availableRewards >= amount, "Insufficient rewards available");

        rewardsDistributed += amount;
        
        // Transferir desde el contrato al destinatario
        _transfer(address(this), recipient, amount);

        emit RewardDistributed(recipient, amount);
    }

    /**
     * @notice Calcula los rewards disponibles
     * @return available Cantidad de NXL disponible para distribuir como rewards
     */
    function getAvailableRewards() public view returns (uint256 available) {
        // Total en el contrato
        uint256 contractBalance = balanceOf(address(this));
        
        // Tokens reservados para vesting que aún no se han retirado
        uint256 founderReserved = FOUNDER_AMOUNT - founderWithdrawn;
        uint256 partnerReserved = PARTNER_AMOUNT - partnerWithdrawn;
        uint256 totalReserved = founderReserved + partnerReserved;
        
        // Rewards disponibles = balance del contrato - tokens reservados
        if (contractBalance > totalReserved) {
            available = contractBalance - totalReserved;
        } else {
            available = 0;
        }
    }

    // ═════════════════════════════════════════════════════════
    // VESTING
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Calcula cuántos tokens puede retirar el Founder
     * @return available Tokens disponibles para retirar
     */
    function getFounderAvailable() public view returns (uint256 available) {
        if (block.timestamp < deploymentTime) return 0;

        uint256 elapsed = block.timestamp - deploymentTime;
        uint256 totalVested;

        if (elapsed >= FOUNDER_VESTING_DURATION) {
            // Vesting completo
            totalVested = FOUNDER_AMOUNT;
        } else {
            // Vesting proporcional
            totalVested = (FOUNDER_AMOUNT * elapsed) / FOUNDER_VESTING_DURATION;
        }

        available = totalVested - founderWithdrawn;
    }

    /**
     * @notice Calcula cuántos tokens puede retirar el Partner
     * @return available Tokens disponibles para retirar
     */
    function getPartnerAvailable() public view returns (uint256 available) {
        if (block.timestamp < deploymentTime) return 0;

        uint256 elapsed = block.timestamp - deploymentTime;
        uint256 totalVested;

        if (elapsed >= PARTNER_VESTING_DURATION) {
            // Vesting completo
            totalVested = PARTNER_AMOUNT;
        } else {
            // Vesting proporcional
            totalVested = (PARTNER_AMOUNT * elapsed) / PARTNER_VESTING_DURATION;
        }

        available = totalVested - partnerWithdrawn;
    }

    /**
     * @notice Founder retira tokens disponibles por vesting
     */
    function founderWithdraw() external {
        require(msg.sender == founderAddress, "Only founder");

        uint256 available = getFounderAvailable();
        require(available > 0, "No tokens available");

        founderWithdrawn += available;
        _transfer(address(this), founderAddress, available);

        emit VestedTokensWithdrawn(founderAddress, available);
    }

    /**
     * @notice Partner retira tokens disponibles por vesting
     */
    function partnerWithdraw() external {
        require(msg.sender == partnerAddress, "Only partner");

        uint256 available = getPartnerAvailable();
        require(available > 0, "No tokens available");

        partnerWithdrawn += available;
        _transfer(address(this), partnerAddress, available);

        emit VestedTokensWithdrawn(partnerAddress, available);
    }

    // ═════════════════════════════════════════════════════════
    // QUEMA DE TOKENS
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Quema tokens no distribuidos del pool de rewards
     * @dev Solo puede ser llamado por el NexumManager cuando se agota el supply
     * @param amount Cantidad de tokens a quemar
     */
    function burnUndistributed(uint256 amount) external {
        require(msg.sender == nexumManager, "Only NexumManager");
        require(amount > 0, "Amount must be > 0");

        uint256 availableRewards = getAvailableRewards();
        require(availableRewards >= amount, "Insufficient balance");

        _burn(address(this), amount);

        emit TokensBurned(amount);
    }

    /**
     * @notice Permite a cualquiera quemar sus propios tokens
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        _burn(msg.sender, amount);

        emit TokensBurned(amount);
    }

    // ═════════════════════════════════════════════════════════
    // VISTAS
    // ═════════════════════════════════════════════════════════

    /**
     * @notice Retorna información completa del token
     */
    function getTokenInfo() external view returns (
        uint256 totalSupply_,
        uint256 contractBalance,
        uint256 availableRewards,
        uint256 rewardsDistributed_,
        uint256 founderTotal,
        uint256 founderWithdrawn_,
        uint256 founderAvailable,
        uint256 partnerTotal,
        uint256 partnerWithdrawn_,
        uint256 partnerAvailable
    ) {
        return (
            totalSupply(),
            balanceOf(address(this)),
            getAvailableRewards(),
            rewardsDistributed,
            FOUNDER_AMOUNT,
            founderWithdrawn,
            getFounderAvailable(),
            PARTNER_AMOUNT,
            partnerWithdrawn,
            getPartnerAvailable()
        );
    }

    /**
     * @notice Retorna información de vesting
     */
    function getVestingInfo() external view returns (
        uint256 founderTotal,
        uint256 founderWithdrawnAmount,
        uint256 founderAvailable,
        uint256 founderVestingEndTime,
        uint256 partnerTotal,
        uint256 partnerWithdrawnAmount,
        uint256 partnerAvailable,
        uint256 partnerVestingEndTime
    ) {
        return (
            FOUNDER_AMOUNT,
            founderWithdrawn,
            getFounderAvailable(),
            founderVestingEnd,
            PARTNER_AMOUNT,
            partnerWithdrawn,
            getPartnerAvailable(),
            partnerVestingEnd
        );
    }
}
