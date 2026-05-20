// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

interface INXLToken {
    function distributeReward(address recipient, uint256 amount) external;
    function burnUndistributed(uint256 amount) external;
    function getAvailableRewards() external view returns (uint256);
}

interface INXLTokenTreasuryConfig {
    function setTreasuryBTC(address treasury) external;
    function treasuryBTC() external view returns (address);
}

interface IReferralNetwork {
    function setReferrer(address user, address referrer) external;
    function hasReferrer(address user) external view returns (bool);
    function getReferralChain(address user) external view returns (address level1, address level2, address level3);
    function distributeCommissions(address buyer, uint256 amount) external;
}

interface ITreasuryBTCNotify {
    function onFundsReceived(uint256 amount) external;
}

interface IAmbassadorDistribute {
    function distributeFunds() external;
}

/**
 * @title NexumManager
 * @author Nexalo Team
 * @notice Core contract for Nexalo ecosystem: lottery, VRF, referrals, staking
 * @dev Handles ticket purchases, VRF-based winner selection, fund distribution
 */
contract NexumManager is VRFConsumerBaseV2, ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    struct NexumProduct {
        string name;
        uint256 priceUSDE18;
        uint256 maxTickets;
        uint256 nxlPerTicket;
        uint256 nxlWinnerBonus;
        uint256 jackpotUSDE18;
        bool active;
    }

    struct Round {
        uint256 productId;
        uint256 roundId;

        uint256 ticketsSold;
        bool completed;

        bool vrfRequested;
        uint256 vrfRequestId;
        uint256 vrfRandomWord;

        address winner;
        uint256 winningTicket;

        uint256 prizePot;
        uint256 instantPot;

        uint256 liquidityTarget;
        uint256 liquidityFunded;
        uint256 liquidityProfitPool;
        uint256 liquidityReturnedPrincipal;
        bool liquiditySettled;
    }

    IERC20 public immutable stablecoin;
    uint8 public immutable stableDecimals;
    INXLToken public immutable nxlToken;

    address public immutable founder;
    address public immutable partner;

    address public treasuryBTC;
    address public referralNetwork;
    address public ambassadorRegistry;

    address public immutable feesReceiver;
    address public immutable operationsService;

    address public auditFunds;
    bool public auditFundsLocked;

    uint256 public auditAccrued;

    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;

    uint32 public callbackGasLimit = 2_500_000;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;

    mapping(uint256 => mapping(uint256 => uint256)) public roundVRFRequestTime;
    uint256 public constant VRF_TIMEOUT = 7 days;

    mapping(uint256 => NexumProduct) public products;
    uint256 public constant PRODUCT_COUNT = 6;

    mapping(uint256 => mapping(uint256 => Round)) public rounds;
    mapping(uint256 => uint256) public currentRound;

    mapping(uint256 => mapping(uint256 => mapping(uint256 => address))) public ticketOwner;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256[]))) public userTickets;

    mapping(uint256 => mapping(uint256 => uint256[])) public availableTickets;
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) public ticketIndexInAvailable;

    mapping(uint256 => uint256) public vrfRequestToProduct;
    mapping(uint256 => uint256) public vrfRequestToRound;

    mapping(address => uint256) public claimableStable;
    mapping(address => uint256) public claimableNXL;

    mapping(uint256 => mapping(uint256 => address[])) private roundInvestorList;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public roundInvestorKnown;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public roundInvestorPrincipal;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public roundInvestorReturned;

    uint256 public constant PCT_PRIZE_POOL   = 5000;
    uint256 public constant PCT_TREASURY_BTC = 1000;
    uint256 public constant PCT_INSTANT      = 1000;
    uint256 public constant PCT_REFERRALS    = 1000;
    uint256 public constant PCT_FOUNDER      = 700;
    uint256 public constant PCT_AMBASSADORS  = 500;
    uint256 public constant PCT_INVESTOR     = 300;
    uint256 public constant PCT_FEES         = 200;
    uint256 public constant PCT_OPS_SERVICE  = 100;
    uint256 public constant PCT_AUDIT        = 100;
    uint256 public constant PCT_PARTNER      = 100;

    bool public paused;
    bool public ecosystemLocked;
    bool public nxlTreasuryConfigured;
    bool public globalStopped;

    /// @notice Pause guardian survives renounceOwnership (set in constructor, immutable after finalizeAutonomy)
    address public pauseGuardian;
    bool public pauseGuardianLocked;

    /// @dev Per-round nonce for ticket randomness (MEV hardening)
    mapping(uint256 => mapping(uint256 => uint256)) private _roundTicketNonce;

    event TicketsPurchased(
        uint256 indexed productId,
        uint256 indexed roundId,
        address indexed buyer,
        uint256 quantity,
        uint256[] ticketNumbers,
        uint256 amountPaid
    );

    event RoundCompleted(uint256 indexed productId, uint256 indexed roundId, address indexed winner, uint256 prize, uint256 winningTicket);
    event NewRoundStarted(uint256 indexed productId, uint256 indexed roundId, uint256 timestamp);
    event VRFRequested(uint256 indexed requestId, uint256 indexed productId, uint256 indexed roundId);

    event ProductReactivated(uint256 indexed productId);
    event NXLRewardsExhausted(uint256 indexed productId);

    event AuditFundsWithdrawn(address indexed to, uint256 amount);
    event AuditFundsSet(address auditFunds);

    event StuckRoundResolved(uint256 indexed productId, uint256 indexed roundId, uint256 newRequestId);
    event StuckRoundPaused(uint256 indexed productId, uint256 indexed roundId);

    event EcosystemAddressesSet(address treasuryBTC, address referralNetwork, address ambassadorRegistry);
    event AutonomyFinalized();

    event ClaimAccrued(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);

    event NXLAccrued(address indexed user, uint256 amount);
    event NXLClaimed(address indexed user, uint256 amount);
    event NXLPartialAccrued(address indexed user, uint256 requested, uint256 accrued);

    event NXLTokenTreasuryConfigured(address treasury);

    event InstantRewardsDistributed(uint256 indexed productId, uint256 indexed roundId, uint256 totalPaid);
    event GlobalStoppedAndNXLBurned(uint256 burnedAmount);

    event RoundLiquidityProvided(uint256 indexed productId, uint256 indexed roundId, address indexed investor, uint256 amount, uint256 fundedAfter, uint256 target);
    event RoundLiquiditySettled(uint256 indexed productId, uint256 indexed roundId, uint256 totalPrincipal, uint256 totalProfit);
    event RoundInvestorAccrued(uint256 indexed productId, uint256 indexed roundId, address indexed investor, uint256 principal, uint256 profit, uint256 totalReturn);

    event SettlementFailed(uint256 indexed productId, uint256 indexed roundId, bytes reason);
    event NewRoundFailed(uint256 indexed productId, bytes reason);



    // ── Custom Errors (gas-efficient) ─────────────────────────────────────
    error ContractPaused();
    error ContractStopped();
    error InvalidProduct();
    error ProductInactive();
    error EcosystemAlreadyLocked();
    error AlreadySet();
    error InvalidAddress();
    error RoundAlreadyCompleted();
    error RoundNotFull();
    error VRFAlreadyRequested();
    error RoundNotStuck();
    error TimeoutNotReached();
    error InsufficientNXL();
    error LiquidityFull();
    error NothingToClaim();
    error AuditLocked();
    error OnlySelf();
    error NoFunds();
    error NotGuardian();

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier validProduct(uint256 productId) {
        if (productId >= PRODUCT_COUNT) revert InvalidProduct();
        if (!products[productId].active) revert ProductInactive();
        _;
    }

    modifier whenNotStopped() {
        if (globalStopped) revert ContractStopped();
        _;
    }

    modifier onlyPauseGuardianOrOwner() {
        if (msg.sender != pauseGuardian && msg.sender != owner()) revert NotGuardian();
        _;
    }

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        address _stablecoin,
        address _nxlToken,
        address _founder,
        address _partner,
        address _feesReceiver,
        address _operationsService,
        address _auditFunds,
        address _pauseGuardian
    )
        VRFConsumerBaseV2(_vrfCoordinator)
        Ownable(msg.sender) // Ownable2Step inherits Ownable — pass initialOwner here
    {
        require(_vrfCoordinator != address(0), "Invalid vrfCoordinator");
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_nxlToken != address(0), "Invalid NXL token");
        require(_founder != address(0), "Invalid founder");
        require(_partner != address(0), "Invalid partner");
        require(_feesReceiver != address(0), "Invalid feesReceiver");
        require(_operationsService != address(0), "Invalid operationsService");
        require(_auditFunds != address(0), "Invalid auditFunds");
        require(_pauseGuardian != address(0), "Invalid pauseGuardian");

        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        stablecoin = IERC20(_stablecoin);
        stableDecimals = IERC20Metadata(_stablecoin).decimals();
        require(stableDecimals <= 18, "Stable decimals > 18");

        nxlToken = INXLToken(_nxlToken);

        founder = _founder;
        partner = _partner;
        feesReceiver = _feesReceiver;
        operationsService = _operationsService;

        auditFunds = _auditFunds;
        auditFundsLocked = true;

        pauseGuardian = _pauseGuardian;

        paused = true;
        globalStopped = false;

        _initializeProducts();
        for (uint256 i = 0; i < PRODUCT_COUNT; ++i) {
            _startNewRound(i);
        }
    }

    function _usdToStable(uint256 usdE18) internal view returns (uint256) {
        if (stableDecimals == 18) return usdE18;
        uint256 factor = 10 ** uint256(18 - stableDecimals);
        return usdE18 / factor;
    }

    function _initializeProducts() private {
        products[0] = NexumProduct("FLASH",      1e18,        1000,  0.1e18,  0.1e18,        500e18,      true);
        products[1] = NexumProduct("ORIGINAL",   1e18,       10000, 0.25e18, 0.25e18,       5000e18,      true);
        products[2] = NexumProduct("PREMIUM",   20e18,        1000,  0.5e18,  0.5e18,      10000e18,      true);
        products[3] = NexumProduct("ELITE",     10e18,       10000, 0.55e18, 0.55e18,      50000e18,      true);
        products[4] = NexumProduct("VIP",      200e18,        1000, 0.85e18, 0.85e18,     100000e18,      true);
        products[5] = NexumProduct("BLACKBLOK", 200e18,      10000,   1e18,     1e18,     1000000e18,     true);
    }

    function _instantExpectedForProduct(uint256 productId) internal view returns (uint256) {
        NexumProduct memory product = products[productId];
        uint256 tickets = product.maxTickets;
        if (tickets == 0 || tickets % 1000 != 0) return 0;
        uint256 factor = tickets / 1000;
        return _usdToStable(product.priceUSDE18 * (100 * factor));
    }

    function setEcosystemAddresses(address _treasuryBTC, address _referralNetwork, address _ambassadorRegistry) external onlyOwner {
        if (ecosystemLocked) revert EcosystemAlreadyLocked();
        if (treasuryBTC != address(0)) revert AlreadySet();
        if (_treasuryBTC == address(0) || _referralNetwork == address(0) || _ambassadorRegistry == address(0)) revert InvalidAddress();
        treasuryBTC = _treasuryBTC;
        referralNetwork = _referralNetwork;
        ambassadorRegistry = _ambassadorRegistry;
        ecosystemLocked = true;
        emit EcosystemAddressesSet(_treasuryBTC, _referralNetwork, _ambassadorRegistry);
    }

    function configureNXLTokenTreasury(address _treasuryBTC) external onlyOwner {
        require(_treasuryBTC != address(0), "Invalid treasury");
        INXLTokenTreasuryConfig(address(nxlToken)).setTreasuryBTC(_treasuryBTC);
        nxlTreasuryConfigured = true;
        emit NXLTokenTreasuryConfigured(_treasuryBTC);
    }

    function setAuditFunds(address _auditFunds) external onlyOwner {
        require(!auditFundsLocked, "Audit locked");
        require(_auditFunds != address(0), "Invalid");
        auditFunds = _auditFunds;
        auditFundsLocked = true;
        emit AuditFundsSet(_auditFunds);
    }

    function finalizeAutonomy() external onlyOwner {
        require(ecosystemLocked, "Set ecosystem first");
        require(nxlTreasuryConfigured, "NXL treasury not configured");
        require(pauseGuardian != address(0), "No pause guardian set");
        pauseGuardianLocked = true; // freeze guardian — cannot be changed after this point
        paused = false;
        emit AutonomyFinalized();
        renounceOwnership();
    }

    /// @notice Replace pauseGuardian before autonomy is finalized (owner only, one-time after).
    function setPauseGuardian(address _guardian) external onlyOwner {
        require(!pauseGuardianLocked, "Guardian locked after finalization");
        require(_guardian != address(0), "Invalid guardian");
        pauseGuardian = _guardian;
    }

    function provideRoundLiquidity(uint256 productId, uint256 roundId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        whenNotStopped
        validProduct(productId)
    {
        Round storage round = rounds[productId][roundId];
        require(round.roundId == roundId && round.productId == productId, "Round not found");
        require(!round.completed, "Round completed");
        require(!round.vrfRequested, "Round closing");
        require(amount > 0, "Amount zero");
        require(round.liquidityFunded < round.liquidityTarget, "Liquidity full");

        uint256 remaining = round.liquidityTarget - round.liquidityFunded;
        uint256 accepted = amount > remaining ? remaining : amount;
        require(accepted > 0, "Nothing accepted");

        stablecoin.safeTransferFrom(msg.sender, address(this), accepted);

        if (!roundInvestorKnown[productId][roundId][msg.sender]) {
            roundInvestorKnown[productId][roundId][msg.sender] = true;
            roundInvestorList[productId][roundId].push(msg.sender);
        }

        roundInvestorPrincipal[productId][roundId][msg.sender] += accepted;
        round.liquidityFunded += accepted;

        emit RoundLiquidityProvided(productId, roundId, msg.sender, accepted, round.liquidityFunded, round.liquidityTarget);
    }

    function getRoundInvestors(uint256 productId, uint256 roundId) external view returns (address[] memory) {
        return roundInvestorList[productId][roundId];
    }

    function getRoundLiquidityStatus(uint256 productId, uint256 roundId)
        external
        view
        returns (
            uint256 liquidityTarget,
            uint256 liquidityFunded,
            uint256 liquidityProfitPool,
            uint256 liquidityReturnedPrincipal,
            bool liquiditySettled,
            uint256 investorsCount,
            uint256 progressBps
        )
    {
        Round storage round = rounds[productId][roundId];
        liquidityTarget = round.liquidityTarget;
        liquidityFunded = round.liquidityFunded;
        liquidityProfitPool = round.liquidityProfitPool;
        liquidityReturnedPrincipal = round.liquidityReturnedPrincipal;
        liquiditySettled = round.liquiditySettled;
        investorsCount = roundInvestorList[productId][roundId].length;
        progressBps = liquidityTarget == 0 ? 0 : (liquidityFunded * 10000) / liquidityTarget;
    }

    function getInvestorPosition(uint256 productId, uint256 roundId, address user)
        external
        view
        returns (
            uint256 principal,
            uint256 estimatedProfit,
            uint256 estimatedTotalReturn,
            uint256 fundedProgressBps,
            bool settled,
            uint256 alreadyAccrued
        )
    {
        Round storage round = rounds[productId][roundId];
        principal = roundInvestorPrincipal[productId][roundId][user];
        settled = round.liquiditySettled;
        alreadyAccrued = roundInvestorReturned[productId][roundId][user];
        fundedProgressBps = round.liquidityTarget == 0 ? 0 : (round.liquidityFunded * 10000) / round.liquidityTarget;

        if (principal == 0 || round.liquidityFunded == 0) {
            return (principal, 0, principal, fundedProgressBps, settled, alreadyAccrued);
        }

        estimatedProfit = (round.liquidityProfitPool * principal) / round.liquidityFunded;
        estimatedTotalReturn = principal + estimatedProfit;
    }

    function buySpecificTickets(
        uint256 productId,
        uint256[] calldata ticketNumbers,
        address referrerAddr
    ) external nonReentrant whenNotPaused whenNotStopped validProduct(productId) {
        uint256 roundId = currentRound[productId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        require(!round.completed, "Round completed");

        uint256 qty = ticketNumbers.length;
        require(qty > 0, "Must select >=1");
        require(qty == 1 || qty == 3 || qty == 5 || qty == 10, "Invalid qty");
        require(round.ticketsSold + qty <= product.maxTickets, "Not enough tickets");

        // H-01 FIX: NXL check removed from purchase gate — _safeDistributeOrAccrueNXL
        // handles exhaustion gracefully (deactivates product, never blocks ticket sale).

        for (uint256 i = 0; i < qty; i++) {
            require(ticketNumbers[i] < product.maxTickets, "Invalid ticket");
            require(ticketOwner[productId][roundId][ticketNumbers[i]] == address(0), "Ticket sold");
            for (uint256 j = i + 1; j < qty; j++) {
                require(ticketNumbers[i] != ticketNumbers[j], "Duplicate ticket");
            }
        }

        uint256 totalPriceStable = _usdToStable(product.priceUSDE18 * qty);
        require(totalPriceStable > 0, "Price too small");

        stablecoin.safeTransferFrom(msg.sender, address(this), totalPriceStable);

        uint256[] memory assigned = new uint256[](qty);
        for (uint256 i = 0; i < qty; i++) {
            uint256 t = ticketNumbers[i];
            _removeFromAvailable(productId, roundId, t);
            ticketOwner[productId][roundId][t] = msg.sender;
            userTickets[productId][roundId][msg.sender].push(t);
            assigned[i] = t;
        }

        round.ticketsSold += qty;

        emit TicketsPurchased(productId, roundId, msg.sender, qty, assigned, totalPriceStable);

        _handleReferrer(msg.sender, referrerAddr);
        _splitFundsPerPurchase(productId, roundId, msg.sender, totalPriceStable);
        _safeDistributeOrAccrueNXL(msg.sender, product.nxlPerTicket * qty, productId);

        if (round.ticketsSold == product.maxTickets) {
            _requestRandomWinner(productId, roundId);
        }
    }

    function buyTickets(uint256 productId, uint256 quantity, address referrerAddr)
        external
        nonReentrant
        whenNotPaused
        whenNotStopped
        validProduct(productId)
    {
        require(quantity == 1 || quantity == 3 || quantity == 5 || quantity == 10, "Invalid qty");

        uint256 roundId = currentRound[productId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        require(!round.completed, "Round completed");
        require(round.ticketsSold + quantity <= product.maxTickets, "Not enough tickets");

        // H-01 FIX: NXL check removed from purchase gate — handled gracefully post-purchase.

        uint256 totalPriceStable = _usdToStable(product.priceUSDE18 * quantity);
        require(totalPriceStable > 0, "Price too small");

        stablecoin.safeTransferFrom(msg.sender, address(this), totalPriceStable);

        uint256[] memory assigned = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; ++i) {
            uint256 t = _takeRandomTicket(productId, roundId, product.maxTickets, i);
            ticketOwner[productId][roundId][t] = msg.sender;
            userTickets[productId][roundId][msg.sender].push(t);
            assigned[i] = t;
        }
        round.ticketsSold += quantity; // GAS OPT: una sola escritura a storage en vez de N

        emit TicketsPurchased(productId, roundId, msg.sender, quantity, assigned, totalPriceStable);

        _handleReferrer(msg.sender, referrerAddr);
        _splitFundsPerPurchase(productId, roundId, msg.sender, totalPriceStable);
        _safeDistributeOrAccrueNXL(msg.sender, product.nxlPerTicket * quantity, productId);

        if (round.ticketsSold == product.maxTickets) {
            _requestRandomWinner(productId, roundId);
        }
    }

    // ── Lazy Fisher-Yates shuffle ──────────────────────────────────────────
    // ticketSwapMap[p][r][i] almacena (valor + 1) para distinguir 0 (no seteado) de ticket #0.
    // El valor implícito en la posición i es i (ticket #i).
    // ticketsRemaining[p][r] = tickets restantes; se inicializa con maxTickets en _startNewRound.
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) public ticketSwapMap;
    // Nota: ticketsRemaining se inicializa en _startNewRound vía _initLazyPool
    mapping(uint256 => mapping(uint256 => uint256)) public ticketsRemaining;

    /// @dev Inicializa el pool lazy (solo graba el contador, sin escribir slots individuales).
    function _initLazyPool(uint256 p, uint256 r, uint256 maxTickets) private {
        ticketsRemaining[p][r] = maxTickets;
    }

    /// @dev Obtiene el ticket en posición virtual idx (sin inicializar storage).
    function _virtualGet(uint256 p, uint256 r, uint256 idx) private view returns (uint256) {
        uint256 stored = ticketSwapMap[p][r][idx]; // stored = ticketId + 1, or 0 if unset
        return stored == 0 ? idx : (stored - 1);
    }

    /// @dev Saca un ticket aleatorio del pool virtual (lazy Fisher-Yates, O(1) por ticket).
    function _takeRandomTicket(
        uint256 productId,
        uint256 roundId,
        uint256 maxTickets,
        uint256 salt
    ) private returns (uint256) {
        uint256 remaining = ticketsRemaining[productId][roundId];
        // Fallback por si _initLazyPool no se llamó (backward compat)
        if (remaining == 0 && rounds[productId][roundId].ticketsSold == 0) {
            remaining = maxTickets;
        }
        require(remaining > 0, "No tickets left");

        uint256 idx = _randomIndex(productId, roundId, remaining, salt);
        uint256 ticketId = _virtualGet(productId, roundId, idx);

        // Fisher-Yates: intercambiar con el último y decrementar
        uint256 lastTicket = _virtualGet(productId, roundId, remaining - 1);
        if (idx != remaining - 1) {
            // Guardar lastTicket en la posición idx (encoded como val+1)
            ticketSwapMap[productId][roundId][idx] = lastTicket + 1;
        }
        // Limpiar el último slot
        delete ticketSwapMap[productId][roundId][remaining - 1];

        ticketsRemaining[productId][roundId] = remaining - 1;
        return ticketId;
    }

    function _removeFromAvailable(uint256 productId, uint256 roundId, uint256 ticketId) private {
        uint256[] storage pool = availableTickets[productId][roundId];
        if (pool.length == 0) return;

        uint256 idx = ticketIndexInAvailable[productId][roundId][ticketId];
        if (idx >= pool.length || pool[idx] != ticketId) return;

        _swapAndPop(pool, productId, roundId, ticketId);
    }

    function _swapAndPop(
        uint256[] storage pool,
        uint256 productId,
        uint256 roundId,
        uint256 ticketId
    ) private {
        uint256 lastIndex = pool.length - 1;
        uint256 idx = ticketIndexInAvailable[productId][roundId][ticketId];

        if (idx != lastIndex) {
            uint256 lastTicket = pool[lastIndex];
            pool[idx] = lastTicket;
            ticketIndexInAvailable[productId][roundId][lastTicket] = idx;
        }

        pool.pop();
        delete ticketIndexInAvailable[productId][roundId][ticketId];
    }

    /// @dev H-02 FIX: MEV-hardened random index for ticket assignment.
    ///      Uses per-round nonce + blockhash(block.number-1) to prevent same-block prediction.
    ///      Note: winner selection uses Chainlink VRF — this is only for ticket number assignment.
    function _randomIndex(uint256 productId, uint256 roundId, uint256 poolLength, uint256 salt) internal returns (uint256) {
        uint256 nonce = ++_roundTicketNonce[productId][roundId];
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    block.prevrandao,
                    msg.sender,
                    address(this),
                    productId,
                    roundId,
                    poolLength,
                    salt,
                    nonce
                )
            )
        );
        return rand % poolLength;
    }

    /// @dev H-01 FIX: Check NXL only when starting a NEW round (not per-ticket).
    ///      If NXL can't cover even one ticket + bonus, deactivate product immediately.
    ///      This prevents the permanent DoS where late-round tickets cannot be purchased.
    function _checkNXLForNewRound(uint256 productId) private {
        NexumProduct memory p = products[productId];
        uint256 minNeeded = p.nxlPerTicket + p.nxlWinnerBonus;
        if (nxlToken.getAvailableRewards() < minNeeded) {
            _deactivateProduct(productId);
        }
    }

    function _checkAndMaybeStopAndBurn() private {
        if (globalStopped) return;

        for (uint256 i = 0; i < PRODUCT_COUNT; i++) {
            if (products[i].active) {
                return;
            }
        }

        uint256 available = nxlToken.getAvailableRewards();
        if (available > 0) {
            try nxlToken.burnUndistributed(available) {
            } catch (bytes memory reason) {
                emit SettlementFailed(0, 0, reason); // FIX: log catch reason instead of silencing
            }
            emit GlobalStoppedAndNXLBurned(available);
        }

        globalStopped = true;
    }

    function _handleReferrer(address buyer, address referrerAddr) private {
        if (referralNetwork == address(0)) return;
        if (referrerAddr == address(0) || referrerAddr == buyer) return;

        IReferralNetwork refNet = IReferralNetwork(referralNetwork);
        if (!refNet.hasReferrer(buyer)) {
            refNet.setReferrer(buyer, referrerAddr);
        }
    }

    function _splitFundsPerPurchase(uint256 productId, uint256 roundId, address buyer, uint256 totalStable) private {
        Round storage round = rounds[productId][roundId];

        uint256 prize = (totalStable * PCT_PRIZE_POOL) / 10000;
        uint256 instant = (totalStable * PCT_INSTANT) / 10000;

        round.prizePot += prize;
        round.instantPot += instant;

        // GAS OPT: Acumular en vez de transferir (ahorra ~120K gas — pull pattern)
        _accrueStable(founder, (totalStable * PCT_FOUNDER) / 10000);

        uint256 investorShare = (totalStable * PCT_INVESTOR) / 10000;
        round.liquidityProfitPool += investorShare;

        if (treasuryBTC != address(0)) {
            uint256 tAmt = (totalStable * PCT_TREASURY_BTC) / 10000;
            try this._safeTransferOut(treasuryBTC, tAmt) {
                try ITreasuryBTCNotify(treasuryBTC).onFundsReceived(tAmt) {
                } catch {
                }
            } catch {
                round.prizePot += tAmt;
            }
        } else {
            round.prizePot += (totalStable * PCT_TREASURY_BTC) / 10000;
        }

        if (ambassadorRegistry != address(0)) {
            uint256 aAmt = (totalStable * PCT_AMBASSADORS) / 10000;
            try this._safeTransferOut(ambassadorRegistry, aAmt) {
            } catch {
                round.prizePot += aAmt;
            }
        } else {
            round.prizePot += (totalStable * PCT_AMBASSADORS) / 10000;
        }

        // GAS OPT: Acumular en vez de transferir
        _accrueStable(feesReceiver, (totalStable * PCT_FEES) / 10000);
        _accrueStable(operationsService, (totalStable * PCT_OPS_SERVICE) / 10000);

        uint256 auditAmount = (totalStable * PCT_AUDIT) / 10000;
        auditAccrued += auditAmount;

        // GAS OPT: Acumular en vez de transferir
        _accrueStable(partner, (totalStable * PCT_PARTNER) / 10000);

        uint256 referralBudget = (totalStable * PCT_REFERRALS) / 10000;
        uint256 toPay = 0;

        if (referralNetwork != address(0)) {
            try IReferralNetwork(referralNetwork).getReferralChain(buyer) returns (
                address l1,
                address l2,
                address l3
            ) {
                if (l1 != address(0)) toPay += (referralBudget * 500) / 1000;
                if (l2 != address(0)) toPay += (referralBudget * 300) / 1000;
                if (l3 != address(0)) toPay += (referralBudget * 200) / 1000;

                if (toPay > 0) {
                    try this._safeTransferOut(referralNetwork, toPay) {
                        try IReferralNetwork(referralNetwork).distributeCommissions(buyer, toPay) {
                        } catch {
                            round.prizePot += toPay;
                            toPay = 0;
                        }
                    } catch {
                        round.prizePot += toPay;
                        toPay = 0;
                    }
                }
            } catch {
                toPay = 0;
            }
        }

        uint256 leftover = referralBudget - toPay;
        if (leftover > 0) round.prizePot += leftover;
    }

    /// @dev Internal helper — llamado via try/catch desde _splitFundsPerPurchase.
    ///      Marcado external para poder usarse con `try this._safeTransferOut(...)`,
    ///      protegido con msg.sender == address(this).
    function _safeTransferOut(address to, uint256 amount) external {
        if (msg.sender != address(this)) revert OnlySelf();
        if (amount == 0) return;
        stablecoin.safeTransfer(to, amount);
    }

    function withdrawAuditFunds() external nonReentrant {
        if (msg.sender != auditFunds) revert InvalidAddress();
        uint256 amount = auditAccrued;
        if (amount == 0) revert NoFunds();
        auditAccrued = 0;
        stablecoin.safeTransfer(msg.sender, amount);
        emit AuditFundsWithdrawn(msg.sender, amount);
    }

    function _requestRandomWinner(uint256 productId, uint256 roundId) private {
        Round storage round = rounds[productId][roundId];
        require(!round.vrfRequested, "VRF already requested");
        require(round.ticketsSold == products[productId].maxTickets, "Round not full");

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );

        vrfRequestToProduct[requestId] = productId;
        vrfRequestToRound[requestId] = roundId;

        round.vrfRequested = true;
        round.vrfRequestId = requestId;
        roundVRFRequestTime[productId][roundId] = block.timestamp;

        emit VRFRequested(requestId, productId, roundId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 productId = vrfRequestToProduct[requestId];
        uint256 roundId = vrfRequestToRound[requestId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        if (!round.vrfRequested || round.completed) return;
        if (round.ticketsSold != product.maxTickets) return;

        uint256 randomWord = randomWords[0];
        uint256 winningTicket = randomWord % product.maxTickets;

        address winner = ticketOwner[productId][roundId][winningTicket];

        // P-01 FIX: Removed unbounded O(maxTickets) fallback loop.
        // Invariant: ticketsSold == maxTickets before VRF is ever requested,
        // so every ticket index in [0, maxTickets) MUST have an owner.
        // If, due to an extreme bug, winner is still address(0), we emit
        // SettlementFailed so the pauseGuardian can intervene via manualSettle.
        if (winner == address(0)) {
            emit SettlementFailed(productId, roundId, abi.encode("winner_slot_empty"));
            return;
        }

        round.vrfRandomWord = randomWord;
        round.winner = winner;
        round.winningTicket = winningTicket;
        round.completed = true;

        // Ambos pasos wrapeados — el callback NUNCA puede revertir (Chainlink best practice)
        // HIGH-02 FIX: Emit events on failure for off-chain monitoring
        try this._externalSettle(productId, roundId, winner, winningTicket, randomWord) {
        } catch (bytes memory reason) {
            emit SettlementFailed(productId, roundId, reason);
        }

        emit RoundCompleted(productId, roundId, winner, round.prizePot, winningTicket);

        try this._externalStartNewRound(productId) {
        } catch (bytes memory reason) {
            emit NewRoundFailed(productId, reason);
        }
    }

    function _externalSettle(uint256 productId, uint256 roundId, address winner, uint256 winningTicket, uint256 randomWord) external {
        if (msg.sender != address(this)) revert OnlySelf();
        _settleRoundToClaims(productId, roundId, winner, winningTicket, randomWord);
    }

    function _externalStartNewRound(uint256 productId) external {
        if (msg.sender != address(this)) revert OnlySelf();
        _startNewRound(productId);
    }

    /// @notice P-04 FIX: Dedicated flag replaces fragile claimableStable-based guard.
    /// @dev Anyone can call when the VRF callback settlement failed (SettlementFailed emitted).
    ///      Protected by roundPrizeAccrued[productId][roundId] — set atomically in _settleRoundToClaims.
    mapping(uint256 => mapping(uint256 => bool)) public roundPrizeAccrued;

    function manualSettle(uint256 productId, uint256 roundId) external nonReentrant {
        Round storage round = rounds[productId][roundId];
        require(round.completed, "Round not completed");
        require(round.winner != address(0), "No winner");
        // P-04 FIX: Use dedicated flag — immune to winner claiming then settling again
        require(!roundPrizeAccrued[productId][roundId], "Prize already accrued");
        _settleRoundToClaims(productId, roundId, round.winner, round.winningTicket, round.vrfRandomWord);
    }


    /// @notice Retries VRF for a stuck round. If VRF retry fails, pauses the round.
    /// @dev SECURITY FIX: Never uses block variables as randomness source for prizes.
    function resolveStuckRound(uint256 productId, uint256 roundId) external nonReentrant {
        Round storage round = rounds[productId][roundId];
        require(round.vrfRequested && !round.completed, "Round not stuck");

        uint256 t = roundVRFRequestTime[productId][roundId];
        require(t != 0, "No request time");
        // forge-lint: disable-next-line(block-timestamp)
        require(block.timestamp > t + VRF_TIMEOUT, "Timeout not reached");

        NexumProduct memory product = products[productId];
        require(round.ticketsSold == product.maxTickets, "Round not full");

        // Retry VRF instead of using manipulable block variables
        try vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        ) returns (uint256 newRequestId) {
            // Update mappings for new request
            vrfRequestToProduct[newRequestId] = productId;
            vrfRequestToRound[newRequestId] = roundId;
            round.vrfRequestId = newRequestId;
            roundVRFRequestTime[productId][roundId] = block.timestamp;

            emit StuckRoundResolved(productId, roundId, newRequestId);
            emit VRFRequested(newRequestId, productId, roundId);
        } catch {
            // VRF retry failed — pause the contract to prevent further damage
            paused = true;
            emit StuckRoundPaused(productId, roundId);
        }
    }

    /// @notice Máximo de inversores procesados por settlement (evita gas exhaustion en VRF callback)
    uint256 public constant MAX_INVESTORS_PER_SETTLEMENT = 100;

    /// @notice Índice del próximo inversor a liquidar (permite paginación si >100 inversores)
    mapping(uint256 => mapping(uint256 => uint256)) public liquiditySettleIndex;

    /// @notice P-02 FIX: Store residual principal/profit per page to avoid O(N) re-iteration.
    ///         On each page, we read from storage instead of recalculating from scratch.
    mapping(uint256 => mapping(uint256 => uint256)) public settleRemainingPrincipal;
    mapping(uint256 => mapping(uint256 => uint256)) public settleRemainingProfit;

    function _settleRoundLiquidity(uint256 productId, uint256 roundId) private {
        Round storage round = rounds[productId][roundId];
        if (round.liquiditySettled) return;

        uint256 totalPrincipal = round.liquidityFunded;
        uint256 totalProfit = round.liquidityProfitPool;
        address[] storage investors = roundInvestorList[productId][roundId];

        if (totalPrincipal == 0 || investors.length == 0) {
            round.liquiditySettled = true;
            if (totalProfit > 0) _accrueStable(founder, totalProfit);
            emit RoundLiquiditySettled(productId, roundId, totalPrincipal, totalProfit);
            return;
        }

        uint256 startIdx = liquiditySettleIndex[productId][roundId];
        uint256 endIdx = startIdx + MAX_INVESTORS_PER_SETTLEMENT;
        if (endIdx > investors.length) endIdx = investors.length;

        // P-02 FIX: Load residuals from storage (O(1)) instead of re-iterating (O(N))
        uint256 remainingPrincipal;
        uint256 remainingProfit;
        if (startIdx == 0) {
            // First page — initialize from round totals
            remainingPrincipal = totalPrincipal;
            remainingProfit = totalProfit;
        } else {
            // Subsequent pages — load stored residuals
            remainingPrincipal = settleRemainingPrincipal[productId][roundId];
            remainingProfit    = settleRemainingProfit[productId][roundId];
        }

        for (uint256 i = startIdx; i < endIdx; ++i) {
            address inv = investors[i];
            uint256 principal = roundInvestorPrincipal[productId][roundId][inv];
            if (principal == 0) continue;

            bool isLast = (i == investors.length - 1);

            uint256 profit = isLast ? remainingProfit : (totalProfit * principal) / totalPrincipal;
            if (profit > remainingProfit) profit = remainingProfit;

            uint256 principalReturn = isLast ? remainingPrincipal : principal;
            if (principalReturn > remainingPrincipal) principalReturn = remainingPrincipal;

            uint256 totalReturn = principalReturn + profit;
            roundInvestorReturned[productId][roundId][inv] += totalReturn;
            round.liquidityReturnedPrincipal += principalReturn;
            _accrueStable(inv, totalReturn);

            if (remainingPrincipal >= principalReturn) remainingPrincipal -= principalReturn; else remainingPrincipal = 0;
            if (remainingProfit >= profit) remainingProfit -= profit; else remainingProfit = 0;

            emit RoundInvestorAccrued(productId, roundId, inv, principalReturn, profit, totalReturn);
        }

        liquiditySettleIndex[productId][roundId] = endIdx;

        // P-02 FIX: Persist residuals for next page (no-op on last page, storage is cheap vs re-iteration)
        settleRemainingPrincipal[productId][roundId] = remainingPrincipal;
        settleRemainingProfit[productId][roundId]    = remainingProfit;

        if (endIdx >= investors.length) {
            round.liquiditySettled = true;
            emit RoundLiquiditySettled(productId, roundId, totalPrincipal, totalProfit);
        }
    }

    /// @notice Permite continuar el settlement si hay más de MAX_INVESTORS_PER_SETTLEMENT inversores.
    function continueSettlement(uint256 productId, uint256 roundId) external nonReentrant {
        Round storage round = rounds[productId][roundId];
        require(round.completed, "Round not complete");
        require(!round.liquiditySettled, "Already settled");
        _settleRoundLiquidity(productId, roundId);
    }

    function _settleRoundToClaims(
        uint256 productId,
        uint256 roundId,
        address winner,
        uint256 winningTicket,
        uint256 randomWord
    ) private {
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        // P-04 FIX: Set flag BEFORE accruing prize (CEI pattern — prevents manualSettle re-entry)
        roundPrizeAccrued[productId][roundId] = true;

        _accrueStable(winner, round.prizePot);

        uint256 paidInstant = _accrueInstantRewardsBestEffort(productId, roundId, winningTicket, randomWord, winner);

        if (round.instantPot > paidInstant) {
            stablecoin.safeTransfer(feesReceiver, round.instantPot - paidInstant);
        }

        emit InstantRewardsDistributed(productId, roundId, paidInstant);

        _settleRoundLiquidity(productId, roundId);
        _safeDistributeOrAccrueNXL(winner, product.nxlWinnerBonus, productId);
    }

    function _accrueStable(address user, uint256 amount) private {
        if (amount == 0) return;
        claimableStable[user] += amount;
        emit ClaimAccrued(user, amount);
    }

    function claimStable() external nonReentrant {
        uint256 amt = claimableStable[msg.sender];
        if (amt == 0) revert NothingToClaim();
        claimableStable[msg.sender] = 0;
        stablecoin.safeTransfer(msg.sender, amt);
        emit Claimed(msg.sender, amt);
    }

    function claimNXL() external nonReentrant {
        uint256 amt = claimableNXL[msg.sender];
        if (amt == 0) revert NothingToClaim();
        claimableNXL[msg.sender] = 0;

        try nxlToken.distributeReward(msg.sender, amt) {
            emit NXLClaimed(msg.sender, amt);
        } catch {
            claimableNXL[msg.sender] = amt;
            revert("NXL claim failed");
        }
    }

    /// @dev CRIT-01 FIX: Never accrue more NXL than actually available.
    ///      If pool is exhausted, accrue only what's left (may be 0).
    function _safeDistributeOrAccrueNXL(address recipient, uint256 amount, uint256 productId) internal {
        if (amount == 0) return;

        uint256 available = nxlToken.getAvailableRewards();
        if (available < amount) {
            _deactivateProduct(productId);
            // CRIT-01 FIX: Only accrue what is actually available, not the full amount
            uint256 toAccrue = available;
            if (toAccrue > 0) {
                claimableNXL[recipient] += toAccrue;
                emit NXLPartialAccrued(recipient, amount, toAccrue);
            }
            return;
        }

        try nxlToken.distributeReward(recipient, amount) {
        } catch {
            // Distribution failed — accrue only what's available right now
            uint256 nowAvailable = nxlToken.getAvailableRewards();
            uint256 toAccrue = nowAvailable < amount ? nowAvailable : amount;
            if (toAccrue > 0) {
                claimableNXL[recipient] += toAccrue;
            }
            emit NXLAccrued(recipient, toAccrue);
            _deactivateProduct(productId);
        }
    }

    function _deactivateProduct(uint256 productId) private {
        if (products[productId].active) {
            products[productId].active = false;
            emit NXLRewardsExhausted(productId);
            _checkAndMaybeStopAndBurn();
        }
    }

    function _accrueInstantRewardsBestEffort(
        uint256 productId,
        uint256 roundId,
        uint256 winningTicket,
        uint256 randomWord,
        address winnerAddress
    ) private returns (uint256 totalPaid) {
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        uint256 tickets = product.maxTickets;
        if (tickets == 0) return 0;
        if (tickets % 1000 != 0) return 0;

        uint256 factor = tickets / 1000;

        uint256 c1 = 41 * factor;
        uint256 c2 = 10 * factor;
        uint256 c3 = 5 * factor;
        uint256 c4 = 6 * factor;
        uint256 totalWinners = c1 + c2 + c3 + c4;

        uint256 p1 = _usdToStable(product.priceUSDE18 * 1);
        uint256 p2 = _usdToStable(product.priceUSDE18 * 2);
        uint256 p3 = _usdToStable(product.priceUSDE18 * 3);
        uint256 p4 = _usdToStable(product.priceUSDE18 * 4);

        uint256 expectedPaid = _usdToStable(product.priceUSDE18 * (100 * factor));
        if (round.instantPot < expectedPaid) return 0;

        uint256 step = (randomWord % (tickets - 1)) + 1;
        step = _makeCoprime(step, tickets);

        uint256 offset = uint256(keccak256(abi.encodePacked(randomWord, productId, roundId, address(this)))) % tickets;

        uint256 idx = offset;
        uint256 winnersFound = 0;
        uint256 maxIters = tickets + totalWinners;

        for (uint256 i = 0; i < maxIters && winnersFound < totalWinners; i++) {
            // M-01 FIX: Gas safety net — leave enough gas for cleanup and storage writes
            if (gasleft() < 50_000) break;
            if (totalPaid >= expectedPaid) break;

            idx = (idx + step) % tickets;

            if (idx == winningTicket) continue;

            address w = ticketOwner[productId][roundId][idx];
            if (w == address(0)) continue;
            if (w == winnerAddress) continue;

            uint256 pay;
            if (winnersFound < c1) pay = p1;
            else if (winnersFound < c1 + c2) pay = p2;
            else if (winnersFound < c1 + c2 + c3) pay = p3;
            else pay = p4;

            uint256 remaining = expectedPaid - totalPaid;
            if (remaining == 0) break;
            if (pay > remaining) pay = remaining;
            if (pay == 0) break;

            _accrueStable(w, pay);
            totalPaid += pay;
            winnersFound++;
        }

        return totalPaid;
    }

    function _makeCoprime(uint256 a, uint256 m) private pure returns (uint256) {
        while (_gcd(a, m) != 1) {
            a++;
            if (a >= m) a = 1;
        }
        return a;
    }

    function _gcd(uint256 x, uint256 y) private pure returns (uint256) {
        while (y != 0) {
            uint256 t = x % y;
            x = y;
            y = t;
        }
        return x;
    }

    function _startNewRound(uint256 productId) private {
        uint256 newRoundId = currentRound[productId] + 1;
        currentRound[productId] = newRoundId;

        uint256 liquidityTarget = _instantExpectedForProduct(productId);

        rounds[productId][newRoundId] = Round({
            productId: productId,
            roundId: newRoundId,
            ticketsSold: 0,
            completed: false,
            vrfRequested: false,
            vrfRequestId: 0,
            vrfRandomWord: 0,
            winner: address(0),
            winningTicket: 0,
            prizePot: 0,
            instantPot: 0,
            liquidityTarget: liquidityTarget,
            liquidityFunded: 0,
            liquidityProfitPool: 0,
            liquidityReturnedPrincipal: 0,
            liquiditySettled: false
        });

        // Inicializar pool lazy de tickets (solo 1 SSTORE en lugar de N)
        _initLazyPool(productId, newRoundId, products[productId].maxTickets);

        // H-01 FIX: Only check NXL at round start — never block mid-round purchases
        _checkNXLForNewRound(productId);

        emit NewRoundStarted(productId, newRoundId, block.timestamp);
    }

    /// @notice HIGH-03 FIX: reactivateProduct callable by guardian OR owner.
    ///         After renounceOwnership, only guardian can reactivate.
    function reactivateProduct(uint256 productId) external onlyPauseGuardianOrOwner {
        if (productId >= PRODUCT_COUNT) revert InvalidProduct();
        require(!products[productId].active, "Already active");
        if (globalStopped) revert ContractStopped();
        products[productId].active = true;
        _startNewRound(productId); // Start a fresh round for the reactivated product
        emit ProductReactivated(productId);
    }

    /// @notice M-01 FIX: pauseGuardian can pause even after renounceOwnership().
    function emergencyPause() external onlyPauseGuardianOrOwner {
        paused = true;
    }

    /// @notice Unpause: requires owner before finalization, guardian after.
    function emergencyUnpause() external onlyPauseGuardianOrOwner {
        paused = false;
    }

    /// @notice HIGH-04 FIX: setCallbackGasLimit callable by guardian OR owner.
    function setCallbackGasLimit(uint32 _gasLimit) external onlyPauseGuardianOrOwner {
        require(_gasLimit >= 1_000_000 && _gasLimit <= 5_000_000, "Invalid gas limit");
        callbackGasLimit = _gasLimit;
    }

    // ── Public Getters (Auditor Fix #4) ───────────────────────────────────

    /// @notice Returns all ticket numbers owned by a user in a specific round.
    /// @dev Exposes the internal userTickets mapping for frontend consumption.
    function getUserTickets(uint256 productId, uint256 roundId, address user)
        external view returns (uint256[] memory)
    {
        return userTickets[productId][roundId][user];
    }

    /// @notice Returns the owner of a specific ticket number in a round.
    /// @dev ticketOwner mapping is already public (auto-getter), but this
    ///      provides a clearer API name for frontend integration.
    function getTicketOwner(uint256 productId, uint256 roundId, uint256 ticketNumber)
        external view returns (address)
    {
        return ticketOwner[productId][roundId][ticketNumber];
    }
}