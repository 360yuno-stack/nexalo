// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

interface INXLToken {
    function distributeReward(address recipient, uint256 amount) external;
    function burnUndistributed(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

interface IReferralNetwork {
    function setReferrer(address user, address referrer) external;
    function distributeCommissions(address buyer, uint256 amount) external;
    function hasReferrer(address user) external view returns (bool);
}

interface IAmbassadorRegistry {
    function distributeFunds() external;
}

contract NexumManager is VRFConsumerBaseV2, ReentrancyGuard, Ownable {
    
    struct NexumProduct {
        string name;
        uint256 priceUSD;
        uint256 maxTickets;
        uint256 nxlPerTicket;
        uint256 nxlWinnerBonus;
        uint256 jackpotUSD;
        bool active;
    }
    
    struct Round {
        uint256 productId;
        uint256 roundId;
        uint256 ticketsSold;
        uint256 totalCollected;
        address winner;
        bool completed;
        bool vrfRequested;
        uint256 vrfRequestId;
        uint256 vrfRandomWord; // aleatorio VRF usado en la ronda
    }
    
    IERC20 public immutable stablecoin;
    INXLToken public immutable nxlToken;
    address public immutable founder;
    address public immutable partner;
    
    address public treasuryBTC;
    address public referralNetwork;
    address public ambassadorRegistry;
    address public buybackContract;
    address public auditFunds;
    
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public callbackGasLimit = 200000;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;
    
    mapping(uint256 => NexumProduct) public products;
    uint256 public constant PRODUCT_COUNT = 6;
    
    mapping(uint256 => mapping(uint256 => Round)) public rounds;
    mapping(uint256 => uint256) public currentRound;
    
    mapping(uint256 => mapping(uint256 => mapping(uint256 => address))) public ticketOwner;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256[]))) public userTickets;
    
    mapping(uint256 => uint256) public vrfRequestToProduct;
    mapping(uint256 => uint256) public vrfRequestToRound;
    
    uint256 public constant MAIN_PRIZE_PCT = 5000;
    uint256 public constant INSTANT_REWARDS_PCT = 1000;
    uint256 public constant MULTILEVEL_PCT = 1000;
    uint256 public constant TREASURY_BTC_PCT = 1000;
    uint256 public constant AMBASSADORS_PCT = 500;
    uint256 public constant OPERATIONS_PCT = 1500;
    
    uint256 public constant FOUNDER_SHARE = 667;
    uint256 public constant AUDIT_SHARE = 133;
    uint256 public constant PARTNER_SHARE = 67;
    uint256 public constant FEES_SHARE = 133;
    
    bool public paused;
    
    event TicketsPurchased(
        uint256 indexed productId,
        uint256 indexed roundId,
        address indexed buyer,
        uint256 quantity,
        uint256[] ticketNumbers,
        uint256 amountPaid
    );
    event RoundCompleted(
        uint256 indexed productId,
        uint256 indexed roundId,
        address indexed winner,
        uint256 prize,
        uint256 winningTicket
    );
    event NewRoundStarted(uint256 indexed productId, uint256 indexed roundId, uint256 timestamp);
    event VRFRequested(uint256 indexed requestId, uint256 indexed productId, uint256 indexed roundId);
    event NXLRewardsExhausted(uint256 indexed productId);
    event ProductReactivated(uint256 indexed productId);
    event AuditFundsTransferred(address indexed to, uint256 amount);
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
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
        address _partner
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_nxlToken != address(0), "Invalid NXL token");
        require(_founder != address(0), "Invalid founder");
        require(_partner != address(0), "Invalid partner");
        
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        stablecoin = IERC20(_stablecoin);
        nxlToken = INXLToken(_nxlToken);
        founder = _founder;
        partner = _partner;
        auditFunds = _founder;
        
        _initializeProducts();
        
        for (uint256 i = 0; i < PRODUCT_COUNT; i++) {
            currentRound[i] = 1;
            emit NewRoundStarted(i, 1, block.timestamp);
        }
    }
    
    function _initializeProducts() private {
        products[0] = NexumProduct("FLASH",      1 * 10**18,  1000, 0.1 * 10**18, 0.1 * 10**18,      500 * 10**18,      true);
        products[1] = NexumProduct("ORIGINAL",   1 * 10**18, 10000, 0.25 * 10**18, 0.25 * 10**18,   5000 * 10**18,      true);
        products[2] = NexumProduct("PREMIUM",   20 * 10**18,  1000, 0.5 * 10**18, 0.5 * 10**18,    10000 * 10**18,      true);
        products[3] = NexumProduct("ELITE",     10 * 10**18, 10000, 0.55 * 10**18, 0.55 * 10**18,  50000 * 10**18,      true);
        products[4] = NexumProduct("VIP",      200 * 10**18,  1000, 0.85 * 10**18, 0.85 * 10**18, 100000 * 10**18,      true);
        products[5] = NexumProduct("BLACKBLOK",200 * 10**18, 10000, 1 * 10**18, 1 * 10**18,      1000000 * 10**18,     true);
    }
    
    function setEcosystemAddresses(
        address _treasuryBTC,
        address _referralNetwork,
        address _ambassadorRegistry,
        address _buybackContract
    ) external onlyOwner {
        require(treasuryBTC == address(0), "Already set");
        require(
            _treasuryBTC != address(0) &&
            _referralNetwork != address(0) &&
            _ambassadorRegistry != address(0) &&
            _buybackContract != address(0),
            "Invalid addresses"
        );
        
        treasuryBTC = _treasuryBTC;
        referralNetwork = _referralNetwork;
        ambassadorRegistry = _ambassadorRegistry;
        buybackContract = _buybackContract;
    }
    
    function buySpecificTickets(
        uint256 productId,
        uint256[] calldata ticketNumbers,
        address referrer
    ) external nonReentrant whenNotPaused validProduct(productId) {
        uint256 roundId = currentRound[productId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];
        
        require(!round.completed, "Round completed");
        require(ticketNumbers.length > 0, "Must select at least one ticket");
        require(
            ticketNumbers.length == 1 || ticketNumbers.length == 3 || 
            ticketNumbers.length == 5 || ticketNumbers.length == 10,
            "Invalid quantity (1/3/5/10)"
        );
        
        for (uint256 i = 0; i < ticketNumbers.length; i++) {
            require(ticketNumbers[i] < product.maxTickets, "Invalid ticket number");
            require(
                ticketOwner[productId][roundId][ticketNumbers[i]] == address(0), 
                "Ticket already sold"
            );
            
            for (uint256 j = i + 1; j < ticketNumbers.length; j++) {
                require(ticketNumbers[i] != ticketNumbers[j], "Duplicate ticket number");
            }
        }
        
        uint256 quantity = ticketNumbers.length;
        uint256 totalPrice = product.priceUSD * quantity;
        require(stablecoin.transferFrom(msg.sender, address(this), totalPrice), "Transfer failed");
        
        for (uint256 i = 0; i < ticketNumbers.length; i++) {
            ticketOwner[productId][roundId][ticketNumbers[i]] = msg.sender;
            userTickets[productId][roundId][msg.sender].push(ticketNumbers[i]);
        }
        
        round.ticketsSold += quantity;
        round.totalCollected += totalPrice;
        
        emit TicketsPurchased(productId, roundId, msg.sender, quantity, ticketNumbers, totalPrice);
        
        uint256 nxlAmount = product.nxlPerTicket * quantity;
        _distributeNXL(msg.sender, nxlAmount, productId);
        
        if (referrer != address(0) && referrer != msg.sender && referralNetwork != address(0)) {
            IReferralNetwork refNet = IReferralNetwork(referralNetwork);
            if (!refNet.hasReferrer(msg.sender)) {
                refNet.setReferrer(msg.sender, referrer);
            }
        }
        
        if (round.ticketsSold >= product.maxTickets) {
            _requestRandomWinner(productId, roundId);
        }
    }
    
    function buyTickets(
        uint256 productId,
        uint256 quantity,
        address referrer
    ) external nonReentrant whenNotPaused validProduct(productId) {
        require(
            quantity == 1 || quantity == 3 || quantity == 5 || quantity == 10,
            "Invalid quantity (1/3/5/10)"
        );
        
        uint256 roundId = currentRound[productId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];
        
        require(!round.completed, "Round completed");
        require(round.ticketsSold + quantity <= product.maxTickets, "Not enough tickets");
        
        uint256 totalPrice = product.priceUSD * quantity;
        require(stablecoin.transferFrom(msg.sender, address(this), totalPrice), "Transfer failed");
        
        uint256[] memory assignedTickets = new uint256[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            uint256 ticketNumber = round.ticketsSold;
            ticketOwner[productId][roundId][ticketNumber] = msg.sender;
            assignedTickets[i] = ticketNumber;
            userTickets[productId][roundId][msg.sender].push(ticketNumber);
            round.ticketsSold++;
        }
        
        round.totalCollected += totalPrice;
        emit TicketsPurchased(productId, roundId, msg.sender, quantity, assignedTickets, totalPrice);
        
        uint256 nxlAmount = product.nxlPerTicket * quantity;
        _distributeNXL(msg.sender, nxlAmount, productId);
        
        if (referrer != address(0) && referrer != msg.sender && referralNetwork != address(0)) {
            IReferralNetwork refNet = IReferralNetwork(referralNetwork);
            if (!refNet.hasReferrer(msg.sender)) {
                refNet.setReferrer(msg.sender, referrer);
            }
        }
        
        if (round.ticketsSold >= product.maxTickets) {
            _requestRandomWinner(productId, roundId);
        }
    }
    
    function _distributeNXL(address recipient, uint256 amount, uint256 productId) private {
        if (amount == 0) return;
        try nxlToken.distributeReward(recipient, amount) {
        } catch {
            _handleNXLExhaustion(productId);
        }
    }
    
    function _handleNXLExhaustion(uint256 productId) private {
        products[productId].active = false;
        
        try nxlToken.burnUndistributed(nxlToken.balanceOf(address(nxlToken))) {
            emit NXLRewardsExhausted(productId);
        } catch {}
        
        bool allInactive = true;
        for (uint256 i = 0; i < PRODUCT_COUNT; i++) {
            if (products[i].active) {
                allInactive = false;
                break;
            }
        }
        
        if (allInactive && auditFunds != address(0) && auditFunds != founder) {
            uint256 auditBalance = stablecoin.balanceOf(auditFunds);
            if (auditBalance > 0) {
                try stablecoin.transferFrom(auditFunds, founder, auditBalance) {
                    emit AuditFundsTransferred(founder, auditBalance);
                } catch {}
            }
        }
    }
    
    function _requestRandomWinner(uint256 productId, uint256 roundId) private {
        Round storage round = rounds[productId][roundId];
        require(!round.vrfRequested, "VRF already requested");
        
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
        
        emit VRFRequested(requestId, productId, roundId);
    }
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 productId = vrfRequestToProduct[requestId];
        uint256 roundId = vrfRequestToRound[requestId];
        Round storage round = rounds[productId][roundId];

        require(!round.completed, "Round already completed");

        uint256 randomWord = randomWords[0];
        uint256 winningTicket = randomWord % round.ticketsSold;
        address winner = ticketOwner[productId][roundId][winningTicket];

        round.vrfRandomWord = randomWord;
        round.winner = winner;
        round.completed = true;

        _distributeRound(productId, roundId, winner, randomWord);
        emit RoundCompleted(productId, roundId, winner, products[productId].jackpotUSD, winningTicket);
        _startNewRound(productId);
    }
    
    function _distributeRound(
        uint256 productId,
        uint256 roundId,
        address winner,
        uint256 randomWord
    ) private {
        Round storage round = rounds[productId][roundId];
        uint256 total = round.totalCollected;
        require(total > 0, "No funds");
        require(stablecoin.balanceOf(address(this)) >= total, "Insufficient balance");

        // Premio principal
        uint256 mainPrize = (total * MAIN_PRIZE_PCT) / 10000;
        _safeTransfer(winner, mainPrize);

        // Rewards instantáneos usando VRF
        uint256 instantAmount = (total * INSTANT_REWARDS_PCT) / 10000;
        _distributeInstantRewardsVRF(productId, roundId, instantAmount, randomWord);

        // Multinivel
        uint256 multilevelAmount = (total * MULTILEVEL_PCT) / 10000;
        if (referralNetwork != address(0)) {
            _safeTransfer(referralNetwork, multilevelAmount);
            IReferralNetwork(referralNetwork).distributeCommissions(winner, multilevelAmount);
        }

        // Treasury BTC
        uint256 treasuryAmount = (total * TREASURY_BTC_PCT) / 10000;
        if (treasuryBTC != address(0)) {
            _safeTransfer(treasuryBTC, treasuryAmount);
        }

        // Embajadores
        uint256 ambassadorAmount = (total * AMBASSADORS_PCT) / 10000;
        if (ambassadorRegistry != address(0)) {
            _safeTransfer(ambassadorRegistry, ambassadorAmount);
        }

        // Operaciones (Founder, Auditoría, Partner, Fees)
        uint256 operationsTotal = (total * OPERATIONS_PCT) / 10000;

        uint256 founderAmount = (operationsTotal * FOUNDER_SHARE) / 1000;
        _safeTransfer(founder, founderAmount);

        uint256 auditAmount = (operationsTotal * AUDIT_SHARE) / 1000;
        _safeTransfer(auditFunds, auditAmount);

        uint256 partnerAmount = (operationsTotal * PARTNER_SHARE) / 1000;
        _safeTransfer(partner, partnerAmount);

        uint256 feesAmount = (operationsTotal * FEES_SHARE) / 1000;
        _safeTransfer(founder, feesAmount);

        // Bonus NXL al ganador
        NexumProduct memory product = products[productId];
        try nxlToken.distributeReward(winner, product.nxlWinnerBonus) {} catch {}
    }

    function _distributeInstantRewardsVRF(
        uint256 productId,
        uint256 roundId,
        uint256 totalAmount,
        uint256 randomWord
    ) private {
        Round storage round = rounds[productId][roundId];

        if (round.ticketsSold == 0 || totalAmount == 0) return;

        uint256 winnersCount = round.ticketsSold < 10 ? round.ticketsSold : 10;
        uint256 prizePerWinner = totalAmount / winnersCount;

        uint256 seed = uint256(keccak256(abi.encodePacked(
            randomWord,
            round.totalCollected,
            productId,
            roundId
        )));

        uint256 offset = seed % round.ticketsSold;
        uint256 step = round.ticketsSold / winnersCount;

        for (uint256 i = 0; i < winnersCount; i++) {
            uint256 ticketIndex = (offset + (i * step)) % round.ticketsSold;
            address instantWinner = ticketOwner[productId][roundId][ticketIndex];

            if (instantWinner != address(0)) {
                _safeTransfer(instantWinner, prizePerWinner);
            }
        }
    }
    
    function _startNewRound(uint256 productId) private {
        uint256 newRoundId = currentRound[productId] + 1;
        currentRound[productId] = newRoundId;
        emit NewRoundStarted(productId, newRoundId, block.timestamp);
    }
    
    function _safeTransfer(address to, uint256 amount) private {
        if (to != address(0) && amount > 0) {
            require(stablecoin.transfer(to, amount), "Transfer failed");
        }
    }
    
    function isTicketAvailable(
        uint256 productId,
        uint256 roundId,
        uint256 ticketNumber
    ) external view returns (bool) {
        return ticketOwner[productId][roundId][ticketNumber] == address(0);
    }
    
    function getUserTickets(
        uint256 productId,
        uint256 roundId,
        address user
    ) external view returns (uint256[] memory) {
        return userTickets[productId][roundId][user];
    }
    
    function getAvailableTickets(uint256 productId) external view returns (uint256) {
        uint256 roundId = currentRound[productId];
        Round storage round = rounds[productId][roundId];
        NexumProduct memory product = products[productId];
        
        if (round.completed) return 0;
        return product.maxTickets - round.ticketsSold;
    }
    
    function getRoundInfo(
        uint256 productId,
        uint256 roundId
    ) external view returns (
        uint256 ticketsSold,
        uint256 totalCollected,
        address winner,
        bool completed,
        bool vrfRequested
    ) {
        Round storage round = rounds[productId][roundId];
        return (
            round.ticketsSold,
            round.totalCollected,
            round.winner,
            round.completed,
            round.vrfRequested
        );
    }
    
    function getProductInfo(uint256 productId) external view returns (
        string memory name,
        uint256 priceUSD,
        uint256 maxTickets,
        uint256 nxlPerTicket,
        uint256 jackpotUSD,
        bool active
    ) {
        NexumProduct memory product = products[productId];
        return (
            product.name,
            product.priceUSD,
            product.maxTickets,
            product.nxlPerTicket,
            product.jackpotUSD,
            product.active
        );
    }
    
    function reactivateProduct(uint256 productId) external onlyOwner {
        require(productId < PRODUCT_COUNT, "Invalid product");
        require(!products[productId].active, "Already active");
        
        products[productId].active = true;
        emit ProductReactivated(productId);
    }
    
    function emergencyPause() external onlyOwner {
        paused = true;
    }
    
    function emergencyUnpause() external onlyOwner {
        paused = false;
    }
    
    function setCallbackGasLimit(uint32 _gasLimit) external onlyOwner {
        require(_gasLimit >= 100000 && _gasLimit <= 500000, "Invalid gas limit");
        callbackGasLimit = _gasLimit;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = stablecoin.balanceOf(address(this));
        require(balance > 0, "No balance");
        _safeTransfer(owner(), balance);
    }
}
