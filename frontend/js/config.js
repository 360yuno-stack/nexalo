// config.js
const CONFIG = {
  NETWORK: {
    chainId: "0x61",
    chainIdDecimal: 97,
    chainName: "BSC Testnet",
    rpcUrls: [
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://data-seed-prebsc-2-s1.binance.org:8545/",
      "https://data-seed-prebsc-1-s2.binance.org:8545/"
    ],
    blockExplorer: "https://testnet.bscscan.com"
  },

  CONTRACTS: {
    USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    NXL_TOKEN: "0xb0ec9dFF66f04415D556CaE105c9588a47BF5Ce0",
    NEXUM_MANAGER: "0xEB359546af0B8A56a4ceE04E8C1296944Ef12245",
    REFERRAL_NETWORK: "0x5fFFDAb9bC8FbCC961b7A64516655a4C8671A4eC",
    AMBASSADOR_REGISTRY: "0xD0D70455D45463bf3a9Ac6a779a1FB22146AAe97",
    TREASURY_BTC: "0x1493CAC4B0756574D397e67808Bd9CC28603e7Ee",
    BUYBACK_CONTRACT: "0xab55A95c9D35F97299D01b97b1B0D23276B03359"
  },

  PRODUCTS: [
    { id: 0, name: "FLASH",     price: 1,   maxTickets: 1000,  nxlPerTicket: 0.1,  nxlWinnerBonus: 0.1,  jackpot: 500,     emoji: "⚡", digits: 3 },
    { id: 1, name: "ORIGINAL",  price: 1,   maxTickets: 10000, nxlPerTicket: 0.25, nxlWinnerBonus: 0.25, jackpot: 5000,    emoji: "🎯", digits: 4 },
    { id: 2, name: "PREMIUM",   price: 20,  maxTickets: 1000,  nxlPerTicket: 0.5,  nxlWinnerBonus: 0.5,  jackpot: 10000,   emoji: "💎", digits: 3 },
    { id: 3, name: "ELITE",     price: 10,  maxTickets: 10000, nxlPerTicket: 0.55, nxlWinnerBonus: 0.55, jackpot: 50000,   emoji: "🚀", digits: 4 },
    { id: 4, name: "VIP",       price: 200, maxTickets: 1000,  nxlPerTicket: 0.85, nxlWinnerBonus: 0.85, jackpot: 100000,  emoji: "👑", digits: 3 },
    { id: 5, name: "BLACKBLOK", price: 200, maxTickets: 10000, nxlPerTicket: 1,    nxlWinnerBonus: 1,    jackpot: 1000000, emoji: "🌟", digits: 4 }
  ]
};

CONFIG.NEXUM_DATA = CONFIG.PRODUCTS;

window.WALLETCONNECT_PROJECT_ID = "PON_AQUI_TU_PROJECT_ID";
window.CONFIG = CONFIG;
