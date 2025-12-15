// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INXLToken is IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title NexaloStaking
 * @dev Staking de NXL con rewards en BTC (WBTC)
 * 
 * CARACTERÍSTICAS:
 * - Stake NXL, recibe WBTC como reward
 * - APY: 3-5% anual
 * - Sin lock-up (puedes retirar cuando quieras)
 * - Rewards acumulados se calculan por segundo
 * - Integración con AAVE (en v2 se conecta pool real)
 */
contract NexaloStaking is ReentrancyGuard, Ownable {
    
    // ========== TOKENS ==========
    INXLToken public immutable nxlToken;
    IERC20 public immutable wbtc; // Wrapped Bitcoin
    
    // ========== APY Y REWARDS ==========
    uint256 public constant APY_RATE = 400; // 4% anual (base 10000)
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // ========== STAKING DATA ==========
    struct Stake {
        uint256 amount;           // NXL staked
        uint256 startTime;        // Cuando hizo stake
        uint256 lastClaimTime;    // Última vez que reclamó rewards
        uint256 totalClaimed;     // Total WBTC reclamado histórico
    }
    
    mapping(address => Stake) public stakes;
    
    // ========== ESTADÍSTICAS GLOBALES ==========
    uint256 public totalStaked;
    uint256 public totalRewardsPaid;
    uint256 public totalStakers;
    
    // ========== EVENTOS ==========
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    constructor(
        address _nxlToken,
        address _wbtc
    ) Ownable(msg.sender) {
        require(_nxlToken != address(0), "Invalid NXL token");
        require(_wbtc != address(0), "Invalid WBTC");
        
        nxlToken = INXLToken(_nxlToken);
        wbtc = IERC20(_wbtc);
    }
    
    // ========== STAKING ==========
    
    /**
     * @dev Hacer stake de NXL
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(
            nxlToken.balanceOf(msg.sender) >= amount,
            "Insufficient NXL balance"
        );
        
        // Si ya tiene stake, reclamar rewards primero
        if (stakes[msg.sender].amount > 0) {
            _claimRewards(msg.sender);
        }
        
        // Transferir NXL al contrato
        require(
            nxlToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Actualizar stake
        if (stakes[msg.sender].amount == 0) {
            totalStakers++;
            stakes[msg.sender] = Stake({
                amount: amount,
                startTime: block.timestamp,
                lastClaimTime: block.timestamp,
                totalClaimed: 0
            });
        } else {
            stakes[msg.sender].amount += amount;
        }
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Retirar NXL (unstake)
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked");
        
        // Reclamar rewards antes de retirar
        _claimRewards(msg.sender);
        
        // Actualizar stake
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        if (stakes[msg.sender].amount == 0) {
            totalStakers--;
        }
        
        // Devolver NXL
        require(
            nxlToken.transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Reclamar rewards acumulados
     */
    function claimRewards() external nonReentrant {
        require(stakes[msg.sender].amount > 0, "No stake found");
        _claimRewards(msg.sender);
    }
    
    /**
     * @dev Reclamar rewards interno
     */
    function _claimRewards(address user) private {
        uint256 pending = calculatePendingRewards(user);
        
        if (pending > 0) {
            require(
                wbtc.balanceOf(address(this)) >= pending,
                "Insufficient WBTC in contract"
            );
            
            stakes[user].lastClaimTime = block.timestamp;
            stakes[user].totalClaimed += pending;
            totalRewardsPaid += pending;
            
            require(wbtc.transfer(user, pending), "WBTC transfer failed");
            
            emit RewardsClaimed(user, pending);
        }
    }
    
    // ========== CÁLCULO DE REWARDS ==========
    
    /**
     * @dev Calcular rewards pendientes de un usuario
     * Formula: (nxlStaked * APY * timeStaked) / (SECONDS_PER_YEAR * 10000)
     */
    function calculatePendingRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        
        if (userStake.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - userStake.lastClaimTime;
        
        // Rewards en NXL value
        uint256 rewardsInNXL = (userStake.amount * APY_RATE * timeStaked) / (SECONDS_PER_YEAR * 10000);
        
        // Convertir a WBTC
        // Asumiendo: 1 NXL = $0.05, 1 WBTC = $50,000
        // 1 WBTC = 1,000,000 NXL
        // rewardsInWBTC = rewardsInNXL / 1,000,000
        // WBTC tiene 8 decimales, NXL tiene 18
        uint256 rewardsInWBTC = (rewardsInNXL * 1e8) / (1_000_000 * 1e18);
        
        return rewardsInWBTC;
    }
    
    /**
     * @dev Calcular APY actual (puede variar según pool WBTC)
     */
    function getCurrentAPY() external pure returns (uint256) {
        return APY_RATE; // 400 = 4%
    }
    
    // ========== FONDEO DE REWARDS ==========
    
    /**
     * @dev Fondear contrato con WBTC para pagar rewards
     */
    function fundRewards(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(
            wbtc.transferFrom(msg.sender, address(this), amount),
            "WBTC transfer failed"
        );
        
        emit RewardsFunded(msg.sender, amount);
    }
    
    // ========== VISTAS PÚBLICAS ==========
    
    /**
     * @dev Información de stake de un usuario
     */
    function getStakeInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 totalClaimed,
        uint256 stakingDuration
    ) {
        Stake memory userStake = stakes[user];
        uint256 pending = calculatePendingRewards(user);
        uint256 duration = userStake.amount > 0 ? block.timestamp - userStake.startTime : 0;
        
        return (
            userStake.amount,
            pending,
            userStake.totalClaimed,
            duration
        );
    }
    
    /**
     * @dev Estadísticas globales
     */
    function getGlobalStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalStakers,
        uint256 _totalRewardsPaid,
        uint256 _wbtcBalance,
        uint256 _apy
    ) {
        return (
            totalStaked,
            totalStakers,
            totalRewardsPaid,
            wbtc.balanceOf(address(this)),
            APY_RATE
        );
    }
    
    /**
     * @dev Calcular rewards estimados por periodo
     */
    function estimateRewards(uint256 nxlAmount, uint256 days_) external pure returns (uint256) {
        uint256 timeInSeconds = days_ * 1 days;
        uint256 rewardsInNXL = (nxlAmount * APY_RATE * timeInSeconds) / (SECONDS_PER_YEAR * 10000);
        uint256 rewardsInWBTC = (rewardsInNXL * 1e8) / (1_000_000 * 1e18);
        
        return rewardsInWBTC;
    }
    
    // ========== ADMIN ==========
    
    /**
     * @dev Retirar exceso de WBTC (solo owner)
     */
    function withdrawExcess(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(wbtc.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        require(wbtc.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @dev Recuperar tokens enviados por error
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(nxlToken), "Cannot recover NXL");
        require(token != address(wbtc), "Cannot recover WBTC (use withdrawExcess)");
        
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Pausa de emergencia
     */
    bool public paused;
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
}
