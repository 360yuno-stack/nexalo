// NEXALO - CONFIGURACIÓN DE CONTRATOS Y RED
// Actualizado con direcciones desplegadas en BSC Testnet

const CONFIG = {
    // Configuración de red BSC Testnet
    NETWORK: {
        chainId: '0x61', // 97 en hexadecimal
        chainName: 'BSC Testnet',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'tBNB',
            decimals: 18
        },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        blockExplorerUrls: ['https://testnet.bscscan.com']
    },

    // ============================================================
    // DIRECCIONES DE CONTRATOS DESPLEGADOS
    // ============================================================
    CONTRACTS: {
        // Token principal NXL
        NXL_TOKEN: '0x939cAFEDa6a3319F7AA4817DBA60A20f570C1963',
        
        // Mock USDT para pruebas en testnet
        MOCK_USDT: '0x076B46A9e103C2c1d79a63F3A414074E4bf07170',
        
        // Contratos principales
        NEXUM_MANAGER: '0x0D96c76a7aA5e38d08CAd0fF552F666189d0C382',
        TREASURY_BTC: '0x9A2E0891290f07e755Af475AC16CA33556958cBD',
        DONATION_VAULT: '0x752C36D141F8ACd36c4A7a49A02C862113350009',
        
        // Sistema de referidos y embajadores
        REFERRAL_NETWORK: '0x05c51604e896F5100267A3799bffE87De1aD506c',
        AMBASSADOR_REGISTRY: '0x241d2C75D168CAb547D17Ff74298cF6CB66Da346',
        
        // Nota: PrizeVault e InstantRewardVault se crean internamente en NexumManager
        // No necesitan direcciones separadas para el frontend
    },

// ============================================================
// CONFIGURACIÓN DE NEXUM (ACTUALIZADA)
// ============================================================

// Precios en USDT
NEXUM_PRICES: {
    FLASH: 1,         // $1 USDT
    ORIGINAL: 1,      // $1 USDT
    PREMIUM: 20,      // $20 USDT
    ELITE: 10,        // $10 USDT
    VIP: 200,         // $200 USDT
    BLACK_BLOK: 200   // $200 USDT
},

// IDs de tipos (6 niveles)
NEXUM_TYPES: {
    FLASH: 0,
    ORIGINAL: 1,
    PREMIUM: 2,
    ELITE: 3,
    VIP: 4,
    BLACK_BLOK: 5
},

// Total de participaciones disponibles por Nexum
NEXUM_TOTAL_PARTICIPATIONS: {
    FLASH: 1000,       // Se venden 1,000 participaciones
    ORIGINAL: 10000,   // Se venden 10,000 participaciones
    PREMIUM: 1000,     // Se venden 1,000 participaciones
    ELITE: 10000,      // Se venden 10,000 participaciones
    VIP: 1000,         // Se venden 1,000 participaciones
    BLACK_BLOK: 10000  // Se venden 10,000 participaciones
},

// NXL que recibe el usuario por cada participación comprada
NEXUM_NXL_PER_PARTICIPATION: {
    FLASH: 0.1,        // 0.1 NXL por participación
    ORIGINAL: 0.25,    // 0.25 NXL por participación
    PREMIUM: 0.5,      // 0.5 NXL por participación
    ELITE: 0.55,       // 0.55 NXL por participación
    VIP: 0.85,         // 0.85 NXL por participación
    BLACK_BLOK: 1.0    // 1 NXL por participación
},

// Premio mayor en USD para el ganador
NEXUM_PRIZES: {
    FLASH: 500,           // $500 USD
    ORIGINAL: 5000,       // $5,000 USD
    PREMIUM: 10000,       // $10,000 USD
    ELITE: 50000,         // $50,000 USD
    VIP: 100000,          // $100,000 USD
    BLACK_BLOK: 1000000   // $1,000,000 USD
},

// Bonus NXL adicional para el ganador del sorteo
NEXUM_WINNER_BONUS: {
    FLASH: 0.1,        // +0.1 NXL extra
    ORIGINAL: 0.25,    // +0.25 NXL extra
    PREMIUM: 0.5,      // +0.5 NXL extra
    ELITE: 0.55,       // +0.55 NXL extra
    VIP: 0.85,         // +0.85 NXL extra
    BLACK_BLOK: 1.0    // +1 NXL extra
},
    // ============================================================
    // CANTIDADES DE COMPRA RÁPIDA
    // ============================================================
    QUICK_BUY_AMOUNTS: [1, 3, 5, 10],

    // ============================================================
    // CONFIGURACIÓN DE STAKING
    // ============================================================
    STAKING_APY: 0.12,           // 12% APY
    STAKING_LOCK_PERIOD: 30,     // 30 días

    // ============================================================
    // MONTOS PREDEFINIDOS DE DONACIÓN (USD)
    // ============================================================
    DONATION_AMOUNTS: [10, 25, 50, 100, 250, 500]
};

// ============================================================
// ABIs DE LOS CONTRATOS
// ============================================================
const ABIS = {
    // ABI del Token NXL (BEP20/ERC20)
    NXL_TOKEN: [
        "function balanceOf(address account) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function totalSupply() view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)"
    ],

    // ABI del Mock USDT (incluye función mint para testing)
    MOCK_USDT: [
        "function balanceOf(address account) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function mint(address to, uint256 amount)",
        "function decimals() view returns (uint8)"
    ],

    // ABI del NexumManager
    NEXUM_MANAGER: [
        "function buyNexum(uint8 nexumType, uint256 quantity, address referrer) payable",
        "function getNexumPrice(uint8 nexumType) view returns (uint256)",
        "function getUserParticipations(address user, uint8 nexumType) view returns (uint256)",
        "function currentRound(uint8 nexumType) view returns (uint256)",
        "function roundInfo(uint8 nexumType, uint256 round) view returns (tuple(uint256 endTime, bool drawn, uint256 totalParticipations, uint256 prizePool))",
        "function getParticipationNumbers(address user, uint8 nexumType) view returns (uint256[])",
        "function drawWinners(uint8 nexumType)",
        "function isWinner(address user, uint8 nexumType, uint256 roundNumber) view returns (bool)",
        "function claimPrize(uint8 nexumType, uint256 roundNumber)",
        "event NexumPurchased(address indexed buyer, uint8 indexed nexumType, uint256 quantity, uint256 roundNumber, uint256[] participationNumbers)",
        "event WinnersDrawn(uint8 indexed nexumType, uint256 indexed roundNumber, address[] winners)",
        "event PrizeClaimed(address indexed winner, uint8 indexed nexumType, uint256 roundNumber, uint256 amount)"
    ],

    // ABI del TreasuryBTC
    TREASURY_BTC: [
        "function stakeNXL(uint256 amount)",
        "function unstake(uint256 amount)",
        "function claimRewards()",
        "function stakedBalance(address user) view returns (uint256)",
        "function pendingRewards(address user) view returns (uint256)",
        "function totalStaked() view returns (uint256)",
        "function stakingStartTime(address user) view returns (uint256)",
        "event Staked(address indexed user, uint256 amount)",
        "event Unstaked(address indexed user, uint256 amount)",
        "event RewardsClaimed(address indexed user, uint256 amount)"
    ],

    // ABI del ReferralNetwork
    REFERRAL_NETWORK: [
        "function registerReferral(address referrer)",
        "function getReferrer(address user) view returns (address)",
        "function getReferralCount(address user) view returns (uint256)",
        "function getTotalEarnings(address user) view returns (uint256)",
        "event ReferralRegistered(address indexed user, address indexed referrer)",
        "event ReferralReward(address indexed referrer, address indexed user, uint256 amount)"
    ],

    // ABI del AmbassadorRegistry
    AMBASSADOR_REGISTRY: [
        "function registerAsAmbassador()",
        "function isAmbassador(address user) view returns (bool)",
        "function getAmbassadorEarnings(address ambassador) view returns (uint256)",
        "function getAmbassadorReferrals(address ambassador) view returns (uint256)",
        "event AmbassadorRegistered(address indexed ambassador)",
        "event AmbassadorReward(address indexed ambassador, uint256 amount)"
    ],

    // ABI del DonationVault
    DONATION_VAULT: [
        "function donate(uint256 amount)",
        "function getTotalDonations() view returns (uint256)",
        "function getUserDonations(address user) view returns (uint256)",
        "function getTopDonors(uint256 count) view returns (address[], uint256[])",
        "event DonationReceived(address indexed donor, uint256 amount)"
    ]
};

// ============================================================
// INFORMACIÓN ADICIONAL
// ============================================================
const NETWORK_INFO = {
    name: 'BSC Testnet',
    deployer: '0xA65d959d82DC2cc329950941D8e306347401CeBf',
    deploymentDate: '2025-12-08',
    version: '1.0.0'
};

// ============================================================
// EXPORTAR CONFIGURACIÓN
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ABIS, NETWORK_INFO };
}

// Log de configuración cargada
console.log('✅ Configuración NXL cargada correctamente');
console.log('🌐 Red:', CONFIG.NETWORK.chainName);
console.log('📋 Contratos configurados:', Object.keys(CONFIG.CONTRACTS).length);
