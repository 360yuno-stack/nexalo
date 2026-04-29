// ============================================
// NEXALO - ABIs DE CONTRATOS
// ============================================

const ABIS = {
  // NXL TOKEN ABI (funciones mínimas necesarias)
  NXL_TOKEN: [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function owner() view returns (address)",
    "function transferOwnership(address newOwner)",
    "function distributeReward(address recipient, uint256 amount)",
    "function burnUndistributed(uint256 amount)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ],

  // NEXUM MANAGER ABI (funciones principales)
  NEXUM_MANAGER: [
    // FUNCIÓN DE COMPRA
    "function buyTickets(uint256 productId, uint256 quantity, address referrer) payable",

    // VISTAS DE PRODUCTOS
    "function products(uint256) view returns (string name, uint256 priceUSD, uint256 maxTickets, uint256 nxlPerTicket, uint256 nxlWinnerBonus, uint256 jackpotUSD, bool active)",
    "function PRODUCT_COUNT() view returns (uint256)",

    // RONDAS
    "function currentRound(uint256 productId) view returns (uint256)",
    "function rounds(uint256 productId, uint256 roundId) view returns (uint256 productId, uint256 roundId, uint256 ticketsSold, uint256 totalCollected, address winner, bool completed, bool vrfRequested, uint256 vrfRequestId)",
    "function getRoundInfo(uint256 productId, uint256 roundId) view returns (uint256 ticketsSold, uint256 totalCollected, address winner, bool completed, bool vrfRequested)",

    // TICKETS
    "function ticketOwner(uint256 productId, uint256 roundId, uint256 ticketNumber) view returns (address)",
    "function getUserTickets(uint256 productId, uint256 roundId, address user) view returns (uint256[])",
    "function getAvailableTickets(uint256 productId) view returns (uint256)",

    // ESTADO
    "function paused() view returns (bool)",
    "function stablecoin() view returns (address)",
    "function nxlToken() view returns (address)",
    "function founder() view returns (address)",
    "function partner() view returns (address)",
    "function globalStopped() view returns (bool)",

    // DIRECCIONES DEL ECOSISTEMA
    "function treasuryBTC() view returns (address)",
    "function referralNetwork() view returns (address)",
    "function ambassadorRegistry() view returns (address)",
    "function buybackContract() view returns (address)",

    // VRF
    "function vrfCoordinator() view returns (address)",
    "function subscriptionId() view returns (uint64)",
    "function keyHash() view returns (bytes32)",
    "function callbackGasLimit() view returns (uint32)",

    // EVENTOS
    "event TicketsPurchased(uint256 indexed productId, uint256 indexed roundId, address indexed buyer, uint256 quantity, uint256[] ticketNumbers, uint256 amountPaid)",
    "event RoundCompleted(uint256 indexed productId, uint256 indexed roundId, address indexed winner, uint256 prize, uint256 winningTicket)",
    "event NewRoundStarted(uint256 indexed productId, uint256 indexed roundId, uint256 timestamp)",
    "event VRFRequested(uint256 indexed requestId, uint256 indexed productId, uint256 indexed roundId)",
    "event NXLRewardsExhausted(uint256 indexed productId)",
    "event InstantRewardsDistributed(uint256 indexed productId, uint256 indexed roundId, uint256 totalPaid)",
    "event GlobalStoppedAndNXLBurned(uint256 burnedAmount)"
  ],

  // TREASURY BTC (ventana anual NXL)
  TREASURY_BTC: [
    "function windowOpen() view returns (bool)",
    "function windowCloseTime() view returns (uint256)",
    "function redeemWindowStart() view returns (uint256)",
    "function redeemWindowPeriod() view returns (uint256)",
    "function lastOpenedYear() view returns (uint256)",
    "function redeemRateE18() view returns (uint256)",
    "function redeem(uint256 nxlAmount) external",
    "event WindowOpened(uint256 yearIndex, uint256 closeTime, uint256 redeemRateE18)",
    "event WindowClosed(uint256 burned)"
  ]
};

console.log("✅ ABIs cargados");
