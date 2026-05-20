export const CONFIG = {
  NETWORK: {
    chainId: 97, // BSC Testnet
    chainName: "BSC Testnet",
    blockExplorer: "https://testnet.bscscan.com",
  },
  CONTRACTS: {
    USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" as const,
    WBTC: "0x8BaBbB98678facC7342735486C851ABD7A0d17Ca" as const,
    NXL_TOKEN: "0x49D76E9F9c7dB89A2ACC91F92ed24E922776F132" as const,
    NEXUM_MANAGER: "0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5" as const,
    REFERRAL_NETWORK: "0x4161C922dFa61E4Faf244543C986041fE6683954" as const,
    AMBASSADOR_REGISTRY: "0x986d003d8c022Bef2d1F5BaA866b93002A5B3b46" as const,
    TREASURY_BTC: "0x0C2a9ccf74Bb658f152C7D837bc4051EAA96C786" as const,
    BUYBACK_CONTRACT: "0x3DBA8365eB322Aec9f766353D7DB29d947Be205D" as const,
    // NexaloStaking — update after fresh deploy with corrected script
    STAKING: "0x0000000000000000000000000000000000000000" as const,
  },
  PRODUCTS: [
    { id: 0, name: "FLASH",     price: 1,   maxTickets: 1000,  nxlPerTicket: 0.1,  nxlWinnerBonus: 0.1,  jackpot: 500,      emoji: "⚡", digits: 3 },
    { id: 1, name: "ORIGINAL",  price: 1,   maxTickets: 10000, nxlPerTicket: 0.25, nxlWinnerBonus: 0.25, jackpot: 5000,     emoji: "🎯", digits: 4 },
    { id: 2, name: "PREMIUM",   price: 20,  maxTickets: 1000,  nxlPerTicket: 0.5,  nxlWinnerBonus: 0.5,  jackpot: 10000,    emoji: "💎", digits: 3 },
    { id: 3, name: "ELITE",     price: 10,  maxTickets: 10000, nxlPerTicket: 0.55, nxlWinnerBonus: 0.55, jackpot: 50000,    emoji: "🚀", digits: 4 },
    { id: 4, name: "VIP",       price: 200, maxTickets: 1000,  nxlPerTicket: 0.85, nxlWinnerBonus: 0.85, jackpot: 100000,   emoji: "👑", digits: 3 },
    { id: 5, name: "BLACKBLOK", price: 200, maxTickets: 10000, nxlPerTicket: 1,    nxlWinnerBonus: 1,    jackpot: 1000000,  emoji: "🌟", digits: 4 }
  ],
  // Fund distribution percentages (per 10000 = 100%)
  DISTRIBUTION: {
    PRIZE_POOL: 50,    // 50%
    TREASURY_BTC: 10,  // 10%
    INSTANT: 10,       // 10%
    REFERRALS: 10,     // 10%
    FOUNDER: 7,        // 7%
    AMBASSADORS: 5,    // 5%
    INVESTOR: 3,       // 3%
    FEES: 2,           // 2%
    OPS_SERVICE: 1,    // 1%
    AUDIT: 1,          // 1%
    PARTNER: 1,        // 1%
  }
} as const;
