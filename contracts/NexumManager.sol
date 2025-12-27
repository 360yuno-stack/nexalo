// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
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

interface IReferralNetwork {
    function setReferrer(address user, address referrer) external;
    function hasReferrer(address user) external view returns (bool);
    function getReferralChain(address user) external view returns (address level1, address level2, address level3);
    function distributeCommissions(address buyer, uint256 amount) external;
}

contract NexumManager is VRFConsumerBaseV2, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ======= PRODUCTOS =======
    struct NexumProduct {
        string name;
        uint256 priceUSD;       // stable decimals
        uint256 maxTickets;     // 1000 or 10000
        uint256 nxlPerTicket;   // 18 decimals
        uint256 nxlWinnerBonus; // 18 decimals
        uint256 jackpotUSD;     // UI only
        bool active;
    }

    struct Round {
        uint256 productId;
        uint256 roundId;

        uint256 ticketsSold;
        uint256 nextTicketCursor; // fix H-01/H-05
        bool completed;

        bool vrfRequested;
        uint256 vrfRequestId;
        uint256 vrfRandomWord;

        address winner;
        uint256 winningTicket;

        uint256 prizePot;   // 50%
        uint256 instantPot; // 10%
    }

    // ======= TOKENS & ADDRS =======
    IERC20 public immutable stablecoin;
    uint8 public immutable stableDecimals;
    INXLToken public immutable nxlToken;

    address public immutable founder;
    address public immutable partner;

    address public treasuryBTC;
    address public referralNetwork;
    address public ambassadorRegistry;

    address public immutable feesReceiver;      // 2%
    address public immutable operationsService; // 1%
    address public auditFunds;                  // pull (configurable once)
    bool public auditFundsLocked;

    // ======= AUDIT FUNDS =======
    uint256 public auditAccrued;

    // ======= VRF =======
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;

    uint32 public callbackGasLimit = 220000;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;

    mapping(uint256 => mapping(uint256 => uint256)) public roundVRFRequestTime;
    uint256 public constant VRF_TIMEOUT = 7 days;

    // ======= PRODUCTS / ROUNDS =======
    mapping(uint256 => NexumProduct) public products;
    uint256 public constant PRODUCT_COUNT = 6;

    mapping(uint256 => mapping(uint256 => Round)) public rounds;
    mapping(uint256 => uint256) public currentRound;

    mapping(uint256 => mapping(uint256 => mapping(uint256 => address))) public ticketOwner;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256[]))) public userTickets;

    mapping(uint256 => uint256) public vrfRequestToProduct;
    mapping(uint256 => uint256) public vrfRequestToRound;

    // ======= Pull payouts stable =======
    mapping(address => uint256) public claimableStable;

    // ======= Pull payouts NXL (C-02 fix) =======
    mapping(address => uint256) public claimableNXL;

    // ======= SPLIT (base 10000) =======
    uint256 public constant PCT_PRIZE_POOL   = 5000; // 50%
    uint256 public constant PCT_FOUNDER      = 1000; // 10%
    uint256 public constant PCT_TREASURY_BTC = 1000; // 10%
    uint256 public constant PCT_INSTANT      = 1000; // 10%
    uint256 public constant PCT_REFERRALS    = 1000; // 10% (5+3+2)
    uint256 public constant PCT_AMBASSADORS  = 500;  // 5%
    uint256 public constant PCT_FEES         = 200;  // 2%
    uint256 public constant PCT_OPS_SERVICE  = 100;  // 1%
    uint256 public constant PCT_AUDIT        = 100;  // 1%
    uint256 public constant PCT_PARTNER      = 100;  // 1%

    bool public paused;
    bool public ecosystemLocked;

    // ======= EVENTS =======
    event TicketsPurchased(uint256 indexed productId, uint256 indexed roundId, address indexed buyer, uint256 quantity, uint256[] ticketNumbers, uint256 amountPaid);
    event RoundCompleted(uint256 indexed productId, uint256 indexed roundId, address indexed winner, uint256 prize, uint256 winningTicket);
    event NewRoundStarted(uint256 indexed productId, uint256 indexed roundId, uint256 timestamp);
    event VRFRequested(uint256 indexed requestId, uint256 indexed productId, uint256 indexed roundId);

    event ProductReactivated(uint256 indexed productId);
    event NXLRewardsExhausted(uint256 indexed productId);

    event AuditFundsWithdrawn(address indexed to, uint256 amount);
    event AuditFundsSet(address auditFunds);

    event StuckRoundResolved(uint256 indexed productId, uint256 indexed roundId, uint256 winningTicket, address winner);

    event EcosystemAddressesSet(address treasuryBTC, address referralNetwork, address ambassadorRegistry);
    event AutonomyFinalized();

    event ClaimAccrued(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);

    event NXLAccrued(address indexed user, uint256 amount);
    event NXLClaimed(address indexed user, uint256 amount);

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    modifier validProduct(uint256 productId) {
        require(productId < PRODUCT_COUNT, "Invalid product");
        require(products[productId].active, "Product inactive");
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
        address _auditFunds
    )
        VRFConsumerBaseV2(_vrfCoordinator)
        Ownable(msg.sender)
    {
        require(_vrfCoordinator != address(0), "Invalid vrfCoordinator");
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_nxlToken != address(0), "Invalid NXL token");
        require(_founder != address(0), "Invalid founder");
        require(_partner != address(0), "Invalid partner");
        require(_feesReceiver != address(0), "Invalid feesReceiver");
        require(_operationsService != address(0), "Invalid operationsService");
        require(_auditFunds != address(0), "Invalid auditFunds");

        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        stablecoin = IERC20(_stablecoin);
        stableDecimals = IERC20Metadata(_stablecoin).decimals();
        nxlToken = INXLToken(_nxlToken);

        founder = _founder;
        partner = _partner;

        feesReceiver = _feesReceiver;
        operationsService = _operationsService;

        auditFunds = _auditFunds;
        auditFundsLocked = true;

        _initializeProducts();

        for (uint256 i = 0; i < PRODUCT_COUNT; i++) {
            _startNewRound(i);
        }
    }

    function _initializeProducts() private {
        uint256 one = 10 ** uint256(stableDecimals);
        products[0] = NexumProduct("FLASH",      1 * one,   1000, 0.1e18,  0.1e18,       500 * one,     true);
        products[1] = NexumProduct("ORIGINAL",   1 * one,  10000, 0.25e18, 0.25e18,     5000 * one,     true);
        products[2] = NexumProduct("PREMIUM",   20 * one,   1000, 0.5e18,  0.5e18,     10000 * one,     true);
        products[3] = NexumProduct("ELITE",     10 * one,  10000, 0.55e18, 0.55e18,    50000 * one,     true);
        products[4] = NexumProduct("VIP",      200 * one,   1000, 0.85e18, 0.85e18,   100000 * one,     true);
        products[5] = NexumProduct("BLACKBLOK", 200 * one, 10000, 1e18,    1e18,     1000000 * one,     true);
    }

    // ========= CONFIG / AUTONOMÍA =========

    function setEcosystemAddresses(address _treasuryBTC, address _referralNetwork, address _ambassadorRegistry) external onlyOwner {
        require(!ecosystemLocked, "Locked");
        require(treasuryBTC == address(0), "Already set");
        require(_treasuryBTC != address(0) && _referralNetwork != address(0) && _ambassadorRegistry != address(0), "Invalid");
        treasuryBTC = _treasuryBTC;
        referralNetwork = _referralNetwork;
        ambassadorRegistry = _ambassadorRegistry;
        ecosystemLocked = true;
        emit EcosystemAddressesSet(_treasuryBTC, _referralNetwork, _ambassadorRegistry);
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
        paused = false;
        emit AutonomyFinalized();
        renounceOwnership();
    }

    // ========= BUY (specific) =========

    function buySpecificTickets(
        uint256 productId,
        uint256[] calldata ticketNumbers,
        address referrerAddr
    ) external nonReentrant whenNotPaused validProduct(productId) {
        uint256 roundId = currentRound[productId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        require(!round.completed, "Round completed");

        uint256 qty = ticketNumbers.length;
        require(qty > 0, "Must select >=1");
        require(qty == 1 || qty == 3 || qty == 5 || qty == 10, "Invalid qty");
        require(round.ticketsSold + qty <= product.maxTickets, "Not enough tickets");

        _requireSufficientNXLForRound(productId, roundId);

        for (uint256 i = 0; i < qty; i++) {
            require(ticketNumbers[i] < product.maxTickets, "Invalid ticket");
            require(ticketOwner[productId][roundId][ticketNumbers[i]] == address(0), "Ticket sold");
            for (uint256 j = i + 1; j < qty; j++) {
                require(ticketNumbers[i] != ticketNumbers[j], "Duplicate ticket");
            }
        }

        uint256 totalPrice = product.priceUSD * qty;
        stablecoin.safeTransferFrom(msg.sender, address(this), totalPrice);

        for (uint256 i = 0; i < qty; i++) {
            uint256 t = ticketNumbers[i];
            ticketOwner[productId][roundId][t] = msg.sender;
            userTickets[productId][roundId][msg.sender].push(t);
        }

        round.ticketsSold += qty;

        emit TicketsPurchased(productId, roundId, msg.sender, qty, ticketNumbers, totalPrice);

        _handleReferrer(msg.sender, referrerAddr);
        _splitFundsPerPurchase(productId, roundId, msg.sender, totalPrice);

        _safeDistributeOrAccrueNXL(msg.sender, product.nxlPerTicket * qty, productId);

        if (round.ticketsSold == product.maxTickets) {
            _requestRandomWinner(productId, roundId);
        }
    }

    // ========= BUY (auto assign - H-01/H-05) =========

    function buyTickets(
        uint256 productId,
        uint256 quantity,
        address referrerAddr
    ) external nonReentrant whenNotPaused validProduct(productId) {
        require(quantity == 1 || quantity == 3 || quantity == 5 || quantity == 10, "Invalid qty");

        uint256 roundId = currentRound[productId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        require(!round.completed, "Round completed");
        require(round.ticketsSold + quantity <= product.maxTickets, "Not enough tickets");

        _requireSufficientNXLForRound(productId, roundId);

        uint256 totalPrice = product.priceUSD * quantity;
        stablecoin.safeTransferFrom(msg.sender, address(this), totalPrice);

        uint256[] memory assigned = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            uint256 t = _nextAvailableTicket(productId, roundId, product.maxTickets, round);
            ticketOwner[productId][roundId][t] = msg.sender;
            userTickets[productId][roundId][msg.sender].push(t);
            assigned[i] = t;
            round.ticketsSold += 1;
        }

        emit TicketsPurchased(productId, roundId, msg.sender, quantity, assigned, totalPrice);

        _handleReferrer(msg.sender, referrerAddr);
        _splitFundsPerPurchase(productId, roundId, msg.sender, totalPrice);

        _safeDistributeOrAccrueNXL(msg.sender, product.nxlPerTicket * quantity, productId);

        if (round.ticketsSold == product.maxTickets) {
            _requestRandomWinner(productId, roundId);
        }
    }

    function _nextAvailableTicket(
        uint256 productId,
        uint256 roundId,
        uint256 maxTickets,
        Round storage round
    ) private returns (uint256) {
        for (uint256 k = 0; k < maxTickets; k++) {
            uint256 idx = round.nextTicketCursor % maxTickets;
            round.nextTicketCursor = idx + 1;
            if (ticketOwner[productId][roundId][idx] == address(0)) return idx;
        }
        revert("No tickets left");
    }

    // ========= NXL strict availability =========

    function _requireSufficientNXLForRound(uint256 productId, uint256 roundId) private view {
        NexumProduct memory product = products[productId];
        Round storage round = rounds[productId][roundId];

        uint256 remaining = product.maxTickets - round.ticketsSold;
        uint256 needed = (remaining * product.nxlPerTicket) + product.nxlWinnerBonus;
        uint256 available = nxlToken.getAvailableRewards();

        require(available >= needed, "Insufficient NXL for round");
    }

    // ========= Referrals =========

    function _handleReferrer(address buyer, address referrerAddr) private {
        if (referralNetwork == address(0)) return;
        if (referrerAddr == address(0) || referrerAddr == buyer) return;

        IReferralNetwork refNet = IReferralNetwork(referralNetwork);
        if (!refNet.hasReferrer(buyer)) {
            refNet.setReferrer(buyer, referrerAddr);
        }
    }

    function _splitFundsPerPurchase(uint256 productId, uint256 roundId, address buyer, uint256 total) private {
        Round storage round = rounds[productId][roundId];

        uint256 prize = (total * PCT_PRIZE_POOL) / 10000;
        uint256 instant = (total * PCT_INSTANT) / 10000;

        round.prizePot += prize;
        round.instantPot += instant;

        stablecoin.safeTransfer(founder, (total * PCT_FOUNDER) / 10000);

        if (treasuryBTC != address(0)) {
            stablecoin.safeTransfer(treasuryBTC, (total * PCT_TREASURY_BTC) / 10000);
        } else {
            round.prizePot += (total * PCT_TREASURY_BTC) / 10000;
        }

        if (ambassadorRegistry != address(0)) {
            stablecoin.safeTransfer(ambassadorRegistry, (total * PCT_AMBASSADORS) / 10000);
        } else {
            round.prizePot += (total * PCT_AMBASSADORS) / 10000;
        }

        stablecoin.safeTransfer(feesReceiver, (total * PCT_FEES) / 10000);
        stablecoin.safeTransfer(operationsService, (total * PCT_OPS_SERVICE) / 10000);

        uint256 auditAmount = (total * PCT_AUDIT) / 10000;
        auditAccrued += auditAmount;

        stablecoin.safeTransfer(partner, (total * PCT_PARTNER) / 10000);

        uint256 referralBudget = (total * PCT_REFERRALS) / 10000;
        uint256 toPay = 0;

        if (referralNetwork != address(0)) {
            (address l1, address l2, address l3) = IReferralNetwork(referralNetwork).getReferralChain(buyer);

            if (l1 != address(0)) toPay += (referralBudget * 500) / 1000;
            if (l2 != address(0)) toPay += (referralBudget * 300) / 1000;
            if (l3 != address(0)) toPay += (referralBudget * 200) / 1000;

            if (toPay > 0) {
                stablecoin.safeTransfer(referralNetwork, toPay);
                IReferralNetwork(referralNetwork).distributeCommissions(buyer, referralBudget);
            }
        }

        uint256 leftover = referralBudget - toPay;
        if (leftover > 0) round.prizePot += leftover;
    }

    // ========= Audit withdrawal (pull) =========

    function withdrawAuditFunds() external nonReentrant {
        require(msg.sender == auditFunds, "Not authorized");
        uint256 amount = auditAccrued;
        require(amount > 0, "No funds");
        auditAccrued = 0;
        stablecoin.safeTransfer(msg.sender, amount);
        emit AuditFundsWithdrawn(msg.sender, amount);
    }

    // ========= VRF =========

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

    /**
     * callback NEVER reverts.
     */
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
        if (winner == address(0)) return;

        round.vrfRandomWord = randomWord;
        round.winner = winner;
        round.winningTicket = winningTicket;
        round.completed = true;

        _settleRoundToClaims(productId, roundId, winner, winningTicket, randomWord);

        emit RoundCompleted(productId, roundId, winner, round.prizePot, winningTicket);
        _startNewRound(productId);
    }

    function resolveStuckRound(uint256 productId, uint256 roundId) external nonReentrant {
        Round storage round = rounds[productId][roundId];
        require(round.vrfRequested && !round.completed, "Round not stuck");

        uint256 t = roundVRFRequestTime[productId][roundId];
        require(t != 0, "No request time");
        require(block.timestamp > t + VRF_TIMEOUT, "Timeout not reached");

        NexumProduct memory product = products[productId];
        require(round.ticketsSold == product.maxTickets, "Round not full");

        uint256 fallbackRandom = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    blockhash(block.number - 1),
                    address(this),
                    productId,
                    roundId
                )
            )
        );

        uint256 winningTicket = fallbackRandom % product.maxTickets;
        address winner = ticketOwner[productId][roundId][winningTicket];
        require(winner != address(0), "Bad winner");

        round.vrfRandomWord = fallbackRandom;
        round.winner = winner;
        round.winningTicket = winningTicket;
        round.completed = true;

        _settleRoundToClaims(productId, roundId, winner, winningTicket, fallbackRandom);

        emit StuckRoundResolved(productId, roundId, winningTicket, winner);
        emit RoundCompleted(productId, roundId, winner, round.prizePot, winningTicket);
        _startNewRound(productId);
    }

    // ======= Settlement (accruals only) =======

    function _settleRoundToClaims(
        uint256 productId,
        uint256 roundId,
        address winner,
        uint256 winningTicket,
        uint256 randomWord
    ) private {
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];

        _accrueStable(winner, round.prizePot);

        // L-04 fix: exclude winner ADDRESS from instant.
        uint256 paidInstant = _accrueInstantRewardsBestEffort(productId, roundId, winningTicket, randomWord, winner);

        // leftover -> fees (no revert)
        if (round.instantPot > paidInstant) {
            stablecoin.safeTransfer(feesReceiver, round.instantPot - paidInstant);
        }

        // NXL bonus safe (never revert)
        _safeDistributeOrAccrueNXL(winner, product.nxlWinnerBonus, productId);
    }

    function _accrueStable(address user, uint256 amount) private {
        if (amount == 0) return;
        claimableStable[user] += amount;
        emit ClaimAccrued(user, amount);
    }

    function claimStable() external nonReentrant {
        uint256 amt = claimableStable[msg.sender];
        require(amt > 0, "Nothing to claim");
        claimableStable[msg.sender] = 0;
        stablecoin.safeTransfer(msg.sender, amt);
        emit Claimed(msg.sender, amt);
    }

    function claimNXL() external nonReentrant {
        uint256 amt = claimableNXL[msg.sender];
        require(amt > 0, "Nothing to claim");
        claimableNXL[msg.sender] = 0;

        try nxlToken.distributeReward(msg.sender, amt) {
            emit NXLClaimed(msg.sender, amt);
        } catch {
            claimableNXL[msg.sender] = amt;
            revert("NXL claim failed");
        }
    }

    function _safeDistributeOrAccrueNXL(address recipient, uint256 amount, uint256 productId) private {
        if (amount == 0) return;

        uint256 available = nxlToken.getAvailableRewards();
        if (available < amount) {
            _deactivateProduct(productId);
            claimableNXL[recipient] += amount;
            emit NXLAccrued(recipient, amount);
            return;
        }

        try nxlToken.distributeReward(recipient, amount) {
        } catch {
            claimableNXL[recipient] += amount;
            emit NXLAccrued(recipient, amount);
            _deactivateProduct(productId);
        }
    }

    function _deactivateProduct(uint256 productId) private {
        if (products[productId].active) {
            products[productId].active = false;
            emit NXLRewardsExhausted(productId);
        }
    }

    /**
     * Instant payouts: best effort, NEVER revert.
     * - Excluye winningTicket
     * - Excluye winnerAddress (L-04)
     * - Si no alcanza winners suficientes, se paga lo encontrado y el resto se va a feesReceiver.
     */
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

        // must be 1000 or 10000
        if (tickets % 1000 != 0) return 0;

        uint256 factor = tickets / 1000;

        uint256 c1 = 41 * factor;
        uint256 c2 = 10 * factor;
        uint256 c3 = 5  * factor;
        uint256 c4 = 6  * factor;
        uint256 totalWinners = c1 + c2 + c3 + c4;

        uint256 p1 = product.priceUSD * 1;
        uint256 p2 = product.priceUSD * 2;
        uint256 p3 = product.priceUSD * 3;
        uint256 p4 = product.priceUSD * 4;

        uint256 expectedPaid = product.priceUSD * (100 * factor);
        if (round.instantPot < expectedPaid) {
            // no revert, just pay nothing
            return 0;
        }

        uint256 step = (randomWord % (tickets - 1)) + 1;
        step = _makeCoprime(step, tickets);

        uint256 offset = uint256(keccak256(abi.encodePacked(randomWord, productId, roundId, address(this)))) % tickets;

        uint256 idx = offset;
        uint256 winnersFound = 0;

        // Intenta buscar ganadores recorriendo más de totalWinners para tolerar skips.
        uint256 maxIters = tickets + totalWinners;

        for (uint256 i = 0; i < maxIters && winnersFound < totalWinners; i++) {
            idx = (idx + step) % tickets;

            if (idx == winningTicket) continue;

            address w = ticketOwner[productId][roundId][idx];
            if (w == address(0)) continue;

            // L-04: exclude winner ADDRESS
            if (w == winnerAddress) continue;

            uint256 pay;
            if (winnersFound < c1) pay = p1;
            else if (winnersFound < c1 + c2) pay = p2;
            else if (winnersFound < c1 + c2 + c3) pay = p3;
            else pay = p4;

            _accrueStable(w, pay);
            totalPaid += pay;
            winnersFound++;
        }

        // Si por alguna razón no llegamos a totalPaid exacto, NO revert.
        // El “resto” se queda como leftover y se envía fuera en settlement (feesReceiver).
        if (totalPaid > expectedPaid) {
            // Safety: should never happen, but cap it.
            return expectedPaid;
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

        rounds[productId][newRoundId] = Round({
            productId: productId,
            roundId: newRoundId,
            ticketsSold: 0,
            nextTicketCursor: 0,
            completed: false,
            vrfRequested: false,
            vrfRequestId: 0,
            vrfRandomWord: 0,
            winner: address(0),
            winningTicket: 0,
            prizePot: 0,
            instantPot: 0
        });

        emit NewRoundStarted(productId, newRoundId, block.timestamp);
    }

    // admin (while owner exists)
    function reactivateProduct(uint256 productId) external onlyOwner {
        require(productId < PRODUCT_COUNT, "Invalid product");
        require(!products[productId].active, "Already active");
        products[productId].active = true;
        emit ProductReactivated(productId);
    }

    function emergencyPause() external onlyOwner { paused = true; }
    function emergencyUnpause() external onlyOwner { paused = false; }

    function setCallbackGasLimit(uint32 _gasLimit) external onlyOwner {
        require(_gasLimit >= 100000 && _gasLimit <= 500000, "Invalid gas limit");
        callbackGasLimit = _gasLimit;
    }
}
