// config.js — Nexalo Frontend Configuration
// ============================================================
// PARA DEPLOY A MAINNET: cambiar MAINNET_MODE a true
// y rellenar las direcciones de MAINNET_CONTRACTS
// ============================================================

const MAINNET_MODE = false; // ← cambiar a true en producción

// ── TESTNET (BSC Testnet, chainId 97) ──────────────────────
const TESTNET_CONFIG = {
  NETWORK: {
    chainId: "0x61",
    chainIdDecimal: 97,
    chainName: "BSC Testnet",
    rpcUrls: [
      "https://bsc-testnet-rpc.publicnode.com",
      "https://bsc-testnet.public.blastapi.io",
      "https://endpoints.omniatech.io/v1/bsc/testnet/public",
      "https://data-seed-prebsc-1-s1.binance.org:8545/"
    ],
    blockExplorer: "https://testnet.bscscan.com"
  },
  CONTRACTS: {
    USDT:               "0xBd43EC0740B034dEDD5Cf7700c34DDDe9863e503",
    NXL_TOKEN:          "0x49D76E9F9c7dB89A2ACC91F92ed24E922776F132",
    NEXUM_MANAGER:      "0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5",
    REFERRAL_NETWORK:   "0x4161C922dFa61E4Faf244543C986041fE6683954",
    AMBASSADOR_REGISTRY:"0x986d003d8c022Bef2d1F5BaA866b93002A5B3b46",
    TREASURY_BTC:       "0x0C2a9ccf74Bb658f152C7D837bc4051EAA96C786",
    BUYBACK_CONTRACT:   "0x3DBA8365eB322Aec9f766353D7DB29d947Be205D"
  }
};

// ── MAINNET (BSC Mainnet, chainId 56) ──────────────────────
const MAINNET_CONFIG = {
  NETWORK: {
    chainId: "0x38",
    chainIdDecimal: 56,
    chainName: "BNB Smart Chain",
    rpcUrls: [
      "https://bsc-dataseed1.binance.org/",
      "https://bsc-dataseed2.binance.org/",
      "https://bsc-rpc.publicnode.com",
      "https://binance.llamarpc.com"
    ],
    blockExplorer: "https://bscscan.com"
  },
  CONTRACTS: {
    // ⚠️ RELLENAR después del deploy a mainnet:
    USDT:               "0x55d398326f99059fF775485246999027B3197955", // BSC USDT oficial
    NXL_TOKEN:          "0x0000000000000000000000000000000000000000", // TODO: deploy
    NEXUM_MANAGER:      "0x0000000000000000000000000000000000000000", // TODO: deploy
    REFERRAL_NETWORK:   "0x0000000000000000000000000000000000000000", // TODO: deploy
    AMBASSADOR_REGISTRY:"0x0000000000000000000000000000000000000000", // TODO: deploy
    TREASURY_BTC:       "0x0000000000000000000000000000000000000000", // TODO: deploy
    BUYBACK_CONTRACT:   "0x0000000000000000000000000000000000000000"  // TODO: deploy
  }
};

// ── Selección automática según modo ──────────────────────────
const ACTIVE = MAINNET_MODE ? MAINNET_CONFIG : TESTNET_CONFIG;

const CONFIG = {
  MAINNET_MODE,
  NETWORK: ACTIVE.NETWORK,
  CONTRACTS: ACTIVE.CONTRACTS,
  PRODUCTS: [
    { id: 0, name: "FLASH",     price: 1,   maxTickets: 1000,  nxlPerTicket: 0.1,  nxlWinnerBonus: 0.1,  jackpot: 500,      emoji: "⚡", digits: 3 },
    { id: 1, name: "ORIGINAL",  price: 1,   maxTickets: 10000, nxlPerTicket: 0.25, nxlWinnerBonus: 0.25, jackpot: 5000,     emoji: "🎯", digits: 4 },
    { id: 2, name: "PREMIUM",   price: 20,  maxTickets: 1000,  nxlPerTicket: 0.5,  nxlWinnerBonus: 0.5,  jackpot: 10000,    emoji: "💎", digits: 3 },
    { id: 3, name: "ELITE",     price: 10,  maxTickets: 10000, nxlPerTicket: 0.55, nxlWinnerBonus: 0.55, jackpot: 50000,    emoji: "🚀", digits: 4 },
    { id: 4, name: "VIP",       price: 200, maxTickets: 1000,  nxlPerTicket: 0.85, nxlWinnerBonus: 0.85, jackpot: 100000,   emoji: "👑", digits: 3 },
    { id: 5, name: "BLACKBLOK", price: 200, maxTickets: 10000, nxlPerTicket: 1,    nxlWinnerBonus: 1,    jackpot: 1000000,  emoji: "🌟", digits: 4 }
  ]
};

CONFIG.NEXUM_DATA = CONFIG.PRODUCTS;

// WalletConnect Project ID — obtener gratis en https://cloud.reown.com
// (antes cloud.walletconnect.com)
window.WALLETCONNECT_PROJECT_ID = "PON_AQUI_TU_PROJECT_ID";
window.CONFIG = CONFIG;

console.log(`✅ Nexalo config cargado — ${MAINNET_MODE ? '🔴 MAINNET' : '🟡 TESTNET'}`);
