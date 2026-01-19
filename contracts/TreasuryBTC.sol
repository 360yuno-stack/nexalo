// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IYieldStrategy.sol";

interface INXLTokenBurnable is IERC20 {
    function burn(uint256 amount) external;
}

interface INXLTokenSnapshot is INXLTokenBurnable {
    function snapshot() external returns (uint256);
    function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256);
    function totalSupplyAt(uint256 snapshotId) external view returns (uint256);
}

interface INexaloStakingWBTC {
    function fundRewards(uint256 amount) external;
}

/**
 * TreasuryBTC:
 * - Recibe stable, strategies Aave/Venus y ventana anual redeem NXL->USDT
 * - Rewards mensuales WBTC holders NXL (snapshot + claim)
 * - FIX H-04: usa circulatingSupplyAtSnapshot (no totalSupplyAt)
 * - Best-effort claim: nunca revierte por falta de WBTC (evita DoS a holders)
 * - Permite fundear staking sin tocar WBTC reservado de holders
 */
contract TreasuryBTC is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;
    INXLTokenSnapshot public immutable nxlToken;
    address public immutable nexumManager;

    uint256 public accountedBalance;

    uint256 public totalFromManager;
    uint256 public totalHarvested;
    uint256 public totalRedeemed;
    uint256 public totalDepositedToStrat;
    uint256 public totalWithdrawnFromStrat;

    IYieldStrategy public strategyAave;
    IYieldStrategy public strategyVenus;
    IYieldStrategy public activeStrategy;

    uint256 public immutable redeemWindowStart;
    uint256 public immutable redeemWindowPeriod;
    uint256 public immutable redeemWindowDuration;

    uint256 public lastOpenedYear;
    bool private lastOpenedYearInit;

    bool public windowOpen;
    uint256 public windowCloseTime;
    uint256 public redeemRateE18;
    uint256 public nxlBurnedThisWindow;

    address public auditFunds;
    bool public auditFundsLocked;

    IERC20 public immutable wbtc;

    INexaloStakingWBTC public staking;

    uint256 public reservedWBTC;

    struct SnapshotRewards {
        uint256 totalWBTC;
        uint256 rewardPerTokenE18;
        uint256 claimedWBTC;
        uint256 circulatingAt;
        bool exists;
    }

    mapping(uint256 => SnapshotRewards) public holderRewardsBySnapshot;
    mapping(uint256 => mapping(address => uint256)) public claimedByUserGross;
    mapping(uint256 => mapping(address => uint256)) public unpaidByUser;

    event FundsReceived(uint256 amount);
    event StrategySet(address aave, address venus);
    event StrategyActivated(address strategy);
    event DepositedToStrategy(address strategy, uint256 amount);
    event WithdrawnFromStrategy(address strategy, uint256 amount);
    event Harvested(address strategy, uint256 gained);

    event WindowOpened(uint256 yearIndex, uint256 closeTime, uint256 redeemRateE18);
    event Redeemed(address indexed user, uint256 nxlIn, uint256 usdtOut);
    event WindowClosed(uint256 burned);

    event AuditFundsSet(address auditFunds);

    event StakingSet(address staking);
    event WBTCDeposited(address indexed from, uint256 amount);

    event HolderRewardsSnapshotted(
        uint256 indexed snapshotId,
        uint256 totalWBTC,
        uint256 rewardPerTokenE18,
        uint256 circulatingAt
    );

    event HolderClaimedBestEffort(
        address indexed user,
        uint256 indexed snapshotId,
        uint256 paid,
        uint256 remainingUnpaid
    );

    event StakingFundedWBTC(uint256 amount);

    modifier onlyNexumManager() {
        require(msg.sender == nexumManager, "Only NexumManager");
        _;
    }

    constructor(
        address _stablecoin,
        address _nxlToken,
        address _nexumManager,
        address _wbtc,
        uint256 _redeemWindowStart,
        uint256 _redeemWindowDuration
    ) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_nxlToken != address(0), "Invalid NXL");
        require(_nexumManager != address(0), "Invalid manager");
        require(_wbtc != address(0), "Invalid WBTC");
        require(_redeemWindowDuration >= 1 days && _redeemWindowDuration <= 30 days, "Bad duration");

        stablecoin = IERC20(_stablecoin);
        nxlToken = INXLTokenSnapshot(_nxlToken);
        nexumManager = _nexumManager;

        wbtc = IERC20(_wbtc);

        redeemWindowStart = _redeemWindowStart;
        redeemWindowPeriod = 365 days;
        redeemWindowDuration = _redeemWindowDuration;

        accountedBalance = stablecoin.balanceOf(address(this));
    }

    // =======================
    // USDT reconciler
    // =======================

    function receiveFunds() external nonReentrant {
        uint256 bal = stablecoin.balanceOf(address(this));
        if (bal > accountedBalance) {
            uint256 delta = bal - accountedBalance;
            accountedBalance = bal;
            emit FundsReceived(delta);
        } else if (bal < accountedBalance) {
            accountedBalance = bal;
        }
    }

    function onFundsReceived(uint256 amount) external onlyNexumManager nonReentrant {
        require(amount > 0, "Amount=0");
        totalFromManager += amount;
        _syncBalance();
        emit FundsReceived(amount);
    }

    function _syncBalance() private {
        accountedBalance = stablecoin.balanceOf(address(this));
    }

    function setAuditFunds(address _auditFunds) external onlyOwner {
        require(!auditFundsLocked, "Audit funds locked");
        require(_auditFunds != address(0), "Invalid auditFunds");
        auditFunds = _auditFunds;
        auditFundsLocked = true;
        emit AuditFundsSet(_auditFunds);
    }

    function setStrategies(address _aave, address _venus) external onlyOwner nonReentrant {
        require(address(strategyAave) == address(0) && address(strategyVenus) == address(0), "Already set");
        require(_aave != address(0) && _venus != address(0), "Invalid");

        strategyAave = IYieldStrategy(_aave);
        strategyVenus = IYieldStrategy(_venus);

        require(strategyAave.stablecoin() == address(stablecoin), "Aave stable mismatch");
        require(strategyVenus.stablecoin() == address(stablecoin), "Venus stable mismatch");
        require(strategyAave.treasury() == address(this), "Aave treasury mismatch");
        require(strategyVenus.treasury() == address(this), "Venus treasury mismatch");

        activeStrategy = strategyAave;

        emit StrategySet(_aave, _venus);
        emit StrategyActivated(address(activeStrategy));
    }

    function activateStrategy(bool useAave) external onlyOwner nonReentrant {
        require(address(strategyAave) != address(0), "Strategies not set");
        activeStrategy = useAave ? strategyAave : strategyVenus;
        emit StrategyActivated(address(activeStrategy));
    }

    function depositToStrategy(uint256 amount) external onlyOwner nonReentrant {
        require(address(activeStrategy) != address(0), "No strategy");
        require(amount > 0, "Amount=0");
        require(stablecoin.balanceOf(address(this)) >= amount, "Insufficient balance");

        stablecoin.forceApprove(address(activeStrategy), 0);
        stablecoin.forceApprove(address(activeStrategy), amount);

        activeStrategy.deposit(amount);

        totalDepositedToStrat += amount;
        _syncBalance();

        emit DepositedToStrategy(address(activeStrategy), amount);
    }

    function withdrawFromStrategy(uint256 amount) external onlyOwner nonReentrant {
        require(address(activeStrategy) != address(0), "No strategy");
        require(amount > 0, "Amount=0");

        activeStrategy.withdraw(amount);

        totalWithdrawnFromStrat += amount;
        _syncBalance();

        emit WithdrawnFromStrategy(address(activeStrategy), amount);
    }

    function withdrawAllFromStrategy() external onlyOwner nonReentrant {
        require(address(activeStrategy) != address(0), "No strategy");
        uint256 got = activeStrategy.withdrawAll();
        totalWithdrawnFromStrat += got;
        _syncBalance();
        emit WithdrawnFromStrategy(address(activeStrategy), got);
    }

    function harvest() external onlyOwner nonReentrant returns (uint256 gained) {
        require(address(activeStrategy) != address(0), "No strategy");
        gained = activeStrategy.harvest();
        if (gained > 0) {
            totalHarvested += gained;
            _syncBalance();
        }
        emit Harvested(address(activeStrategy), gained);
    }

    function _circulatingSupply() internal view returns (uint256) {
        uint256 total = nxlToken.totalSupply();
        uint256 heldByToken = nxlToken.balanceOf(address(nxlToken));
        if (total > heldByToken) return total - heldByToken;
        return 0;
    }

    function openRedeemWindow() external nonReentrant {
        require(block.timestamp >= redeemWindowStart, "Not started");
        require(!windowOpen, "Already open");

        uint256 yearIndex = (block.timestamp - redeemWindowStart) / redeemWindowPeriod;

        if (!lastOpenedYearInit) {
            lastOpenedYearInit = true;
        } else {
            require(yearIndex != lastOpenedYear, "Already opened this year");
        }

        uint256 usdtBal = stablecoin.balanceOf(address(this));
        require(usdtBal > 0, "No USDT liquidity");

        uint256 circ = _circulatingSupply();
        require(circ > 0, "No circulating supply");

        redeemRateE18 = (usdtBal * 1e18) / circ;

        windowOpen = true;
        windowCloseTime = block.timestamp + redeemWindowDuration;
        lastOpenedYear = yearIndex;
        nxlBurnedThisWindow = 0;

        emit WindowOpened(yearIndex, windowCloseTime, redeemRateE18);
    }

    function redeem(uint256 nxlAmount) external nonReentrant {
        require(windowOpen, "Window closed");
        require(block.timestamp <= windowCloseTime, "Window expired");
        require(nxlAmount > 0, "Amount=0");

        uint256 usdtOut = (nxlAmount * redeemRateE18) / 1e18;
        require(usdtOut > 0, "Too small");
        require(stablecoin.balanceOf(address(this)) >= usdtOut, "Insufficient USDT");

        IERC20(address(nxlToken)).safeTransferFrom(msg.sender, address(this), nxlAmount);
        nxlToken.burn(nxlAmount);

        nxlBurnedThisWindow += nxlAmount;
        totalRedeemed += usdtOut;

        stablecoin.safeTransfer(msg.sender, usdtOut);
        _syncBalance();

        emit Redeemed(msg.sender, nxlAmount, usdtOut);
    }

    function closeRedeemWindow() external nonReentrant {
        require(windowOpen, "Not open");
        require(block.timestamp > windowCloseTime, "Not expired");
        windowOpen = false;
        emit WindowClosed(nxlBurnedThisWindow);
    }

    function totalAssets() external view returns (uint256) {
        uint256 bal = stablecoin.balanceOf(address(this));
        uint256 strat = address(activeStrategy) == address(0) ? 0 : activeStrategy.totalAssets();
        return bal + strat;
    }

    // =======================
    // WBTC holders rewards + staking funding
    // =======================

    function setStaking(address _staking) external onlyOwner {
        require(_staking != address(0), "Invalid staking");
        staking = INexaloStakingWBTC(_staking);
        emit StakingSet(_staking);
    }

    function depositWBTC(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount=0");
        wbtc.safeTransferFrom(msg.sender, address(this), amount);
        emit WBTCDeposited(msg.sender, amount);
    }

    function snapshotAndAllocateHolderRewards(uint256 amount)
        external
        onlyOwner
        nonReentrant
        returns (uint256 snapshotId)
    {
        require(amount > 0, "Amount=0");
        require(wbtc.balanceOf(address(this)) >= reservedWBTC + amount, "Insufficient unreserved WBTC");

        snapshotId = nxlToken.snapshot();

        uint256 totalAt = nxlToken.totalSupplyAt(snapshotId);
        uint256 heldAt = nxlToken.balanceOfAt(address(nxlToken), snapshotId);
        require(totalAt > heldAt, "No circulating supply at snapshot");
        uint256 circulatingAt = totalAt - heldAt;

        uint256 rpt = (amount * 1e18) / circulatingAt;

        holderRewardsBySnapshot[snapshotId] = SnapshotRewards({
            totalWBTC: amount,
            rewardPerTokenE18: rpt,
            claimedWBTC: 0,
            circulatingAt: circulatingAt,
            exists: true
        });

        reservedWBTC += amount;

        emit HolderRewardsSnapshotted(snapshotId, amount, rpt, circulatingAt);
    }

    function pendingHolderRewards(uint256 snapshotId, address user) public view returns (uint256) {
        SnapshotRewards memory s = holderRewardsBySnapshot[snapshotId];
        if (!s.exists) return 0;

        uint256 balAt = nxlToken.balanceOfAt(user, snapshotId);
        uint256 gross = (balAt * s.rewardPerTokenE18) / 1e18;

        uint256 claimedGross = claimedByUserGross[snapshotId][user];
        uint256 unpaid = unpaidByUser[snapshotId][user];

        if (gross <= claimedGross) return unpaid;
        return (gross - claimedGross) + unpaid;
    }

    function claimHolderRewards(uint256 snapshotId) external nonReentrant {
        SnapshotRewards storage s = holderRewardsBySnapshot[snapshotId];
        require(s.exists, "Snapshot not found");

        uint256 balAt = nxlToken.balanceOfAt(msg.sender, snapshotId);
        uint256 gross = (balAt * s.rewardPerTokenE18) / 1e18;

        uint256 claimedGross = claimedByUserGross[snapshotId][msg.sender];
        uint256 unpaid = unpaidByUser[snapshotId][msg.sender];

        uint256 owed = unpaid;
        if (gross > claimedGross) owed += (gross - claimedGross);

        require(owed > 0, "Nothing to claim");

        uint256 available = wbtc.balanceOf(address(this));
        require(available >= owed, "Insufficient Treasury Balance");
        uint256 toPay = owed;
        uint256 remaining = 0;

        claimedByUserGross[snapshotId][msg.sender] = gross;
        unpaidByUser[snapshotId][msg.sender] = remaining;

        if (toPay > 0) {
            s.claimedWBTC += toPay;

            if (reservedWBTC >= toPay) reservedWBTC -= toPay;
            else reservedWBTC = 0;

            wbtc.safeTransfer(msg.sender, toPay);
        }

        emit HolderClaimedBestEffort(msg.sender, snapshotId, toPay, remaining);
    }

    function fundStakingWBTC(uint256 amount) external onlyOwner nonReentrant {
        require(address(staking) != address(0), "Staking not set");
        require(amount > 0, "Amount=0");

        uint256 bal = wbtc.balanceOf(address(this));
        require(bal >= reservedWBTC + amount, "Not enough unreserved WBTC");

        // OZ5: no safeApprove, usar forceApprove
        wbtc.forceApprove(address(staking), 0);
        wbtc.forceApprove(address(staking), amount);

        staking.fundRewards(amount);

        emit StakingFundedWBTC(amount);
    }
}
