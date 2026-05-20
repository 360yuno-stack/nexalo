import { parseAbi } from 'viem';

export const ABIS = {
  NXL_TOKEN: parseAbi([
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function distributeReward(address recipient, uint256 amount)",
    "function burnUndistributed(uint256 amount)",
    "function getAvailableRewards() view returns (uint256)",
    "function nexumManager() view returns (address)",
    "function treasuryBTC() view returns (address)",
    "function founderAddress() view returns (address)",
    "function partnerAddress() view returns (address)",
    "function deploymentTime() view returns (uint256)",
    "function rewardsDistributed() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ]),

  NEXUM_MANAGER: parseAbi([
    // ERRORS
    "error ContractPaused()",
    "error ContractStopped()",
    "error InvalidProduct()",
    "error ProductInactive()",

    // BUY FUNCTIONS
    "function buyTickets(uint256 productId, uint256 quantity, address referrerAddr)",
    "function buySpecificTickets(uint256 productId, uint256[] ticketNumbers, address referrerAddr)",

    // PRODUCTS
    "function products(uint256) view returns (string name, uint256 priceUSDE18, uint256 maxTickets, uint256 nxlPerTicket, uint256 nxlWinnerBonus, uint256 jackpotUSDE18, bool active)",
    "function PRODUCT_COUNT() view returns (uint256)",

    // ROUNDS — matches actual 16-field Round struct
    "function currentRound(uint256 productId) view returns (uint256)",
    "function rounds(uint256 productId, uint256 roundId) view returns (uint256 productId, uint256 roundId, uint256 ticketsSold, bool completed, bool vrfRequested, uint256 vrfRequestId, uint256 vrfRandomWord, address winner, uint256 winningTicket, uint256 prizePot, uint256 instantPot, uint256 liquidityTarget, uint256 liquidityFunded, uint256 liquidityProfitPool, uint256 liquidityReturnedPrincipal, bool liquiditySettled)",

    // TICKETS — Auditor getters
    "function getUserTickets(uint256 productId, uint256 roundId, address user) view returns (uint256[])",
    "function getTicketOwner(uint256 productId, uint256 roundId, uint256 ticketNumber) view returns (address)",
    "function ticketOwner(uint256 productId, uint256 roundId, uint256 ticketNumber) view returns (address)",
    "function ticketsRemaining(uint256 productId, uint256 roundId) view returns (uint256)",

    // CLAIMS
    "function claimableStable(address user) view returns (uint256)",
    "function claimableNXL(address user) view returns (uint256)",
    "function claimStable()",
    "function claimNXL()",

    // INVESTOR / LIQUIDITY
    "function provideRoundLiquidity(uint256 productId, uint256 roundId, uint256 amount)",
    "function getRoundLiquidityStatus(uint256 productId, uint256 roundId) view returns (uint256 liquidityTarget, uint256 liquidityFunded, uint256 liquidityProfitPool, uint256 liquidityReturnedPrincipal, bool liquiditySettled, uint256 investorsCount, uint256 progressBps)",
    "function getInvestorPosition(uint256 productId, uint256 roundId, address user) view returns (uint256 principal, uint256 estimatedProfit, uint256 estimatedTotalReturn, uint256 fundedProgressBps, bool settled, uint256 alreadyAccrued)",
    "function getRoundInvestors(uint256 productId, uint256 roundId) view returns (address[])",

    // STATE
    "function paused() view returns (bool)",
    "function stablecoin() view returns (address)",
    "function nxlToken() view returns (address)",
    "function founder() view returns (address)",
    "function partner() view returns (address)",
    "function globalStopped() view returns (bool)",
    "function treasuryBTC() view returns (address)",
    "function referralNetwork() view returns (address)",
    "function ambassadorRegistry() view returns (address)",
    "function pauseGuardian() view returns (address)",
    "function callbackGasLimit() view returns (uint32)",

    // EVENTS
    "event TicketsPurchased(uint256 indexed productId, uint256 indexed roundId, address indexed buyer, uint256 quantity, uint256[] ticketNumbers, uint256 amountPaid)",
    "event RoundCompleted(uint256 indexed productId, uint256 indexed roundId, address indexed winner, uint256 prize, uint256 winningTicket)",
    "event NewRoundStarted(uint256 indexed productId, uint256 indexed roundId, uint256 timestamp)",
    "event ClaimAccrued(address indexed user, uint256 amount)",
    "event Claimed(address indexed user, uint256 amount)"
  ]),

  TREASURY_BTC: parseAbi([
    "function windowOpen() view returns (bool)",
    "function windowCloseTime() view returns (uint256)",
    "function redeemWindowStart() view returns (uint256)",
    "function redeemWindowPeriod() view returns (uint256)",
    "function lastOpenedYear() view returns (uint256)",
    "function redeemRateE18() view returns (uint256)",
    "function redeem(uint256 nxlAmount) external",
    "event WindowOpened(uint256 yearIndex, uint256 closeTime, uint256 redeemRateE18)",
    "event WindowClosed(uint256 burned)"
  ]),

  STAKING: parseAbi([
    "function stake(uint256 amount)",
    "function unstake(uint256 amount)",
    "function claimRewards()",
    "function pendingRewards(address user) view returns (uint256)",
    "function users(address) view returns (uint256 amount, uint256 rewardDebt, uint256 totalClaimed, uint256 unpaidRewards)",
    "function totalStaked() view returns (uint256)",
    "function accRewardPerShareE18() view returns (uint256)",
    "function fundedButUndistributed() view returns (uint256)",
    "event Staked(address indexed user, uint256 amount)",
    "event Unstaked(address indexed user, uint256 amount)",
    "event Claimed(address indexed user, uint256 amount)"
  ]),

  AMBASSADOR_REGISTRY: parseAbi([
    "function approvedForRegistration(address) view returns (bool)",
    "function selfRegister(string name)",
    "function pendingRewards(address ambassador) view returns (uint256)",
    "function claim()",
    "function ambassadors(address) view returns (bool active, uint256 totalClaimed, uint256 rewardDebtE18, uint256 storedRewards, string name)",
    "function activeCount() view returns (uint256)",
    "event AmbassadorRegistered(address indexed ambassador, string name)",
    "event Claimed(address indexed ambassador, uint256 amount)"
  ]),

  REFERRAL_NETWORK: parseAbi([
    "function hasReferrer(address user) view returns (bool)",
    "function getReferralChain(address user) view returns (address level1, address level2, address level3)",
    "event ReferrerSet(address indexed user, address indexed referrer)"
  ])
} as const;
