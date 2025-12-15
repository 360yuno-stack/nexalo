// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TreasuryBTC
 * @notice Gestiona el 10% de fondos destinados a staking de BTC
 * @dev Recibe USDT del NexumManager, el Founder gestiona el staking externo,
 *      y distribuye rewards mensuales a holders de NXL
 */
contract TreasuryBTC is Ownable, ReentrancyGuard {

    IERC20 public immutable stablecoin;
    IERC20 public immutable nxlToken;
    
    address public immutable founder;
    address public nexumManager;
    
    uint256 public totalDeposited;
    uint256 public totalWithdrawnForStaking;
    uint256 public totalRewardsDistributed;
    
    uint256 public constant MIN_WITHDRAWAL_INTERVAL = 30 days;
    uint256 public lastWithdrawalTime;
    
    bool public stakingActive;
    
    struct RewardSnapshot {
        uint256 timestamp;
        uint256 totalRewards;
        uint256 totalNXLSupply;
        bool distributed;
    }
    
    mapping(uint256 => RewardSnapshot) public rewardSnapshots;
    uint256 public snapshotCount;
    
    mapping(address => mapping(uint256 => bool)) public userClaimed;
    mapping(address => uint256) public totalClaimedByUser;

    event FundsReceived(address indexed from, uint256 amount);
    event FundsWithdrawnForStaking(address indexed to, uint256 amount);
    event RewardsDeposited(uint256 indexed snapshotId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed snapshotId, uint256 amount);
    event StakingStatusChanged(bool active);
    event NexumManagerSet(address indexed manager);

    constructor(
        address _stablecoin,
        address _nxlToken,
        address _founder
    ) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_nxlToken != address(0), "Invalid NXL token");
        require(_founder != address(0), "Invalid founder");

        stablecoin = IERC20(_stablecoin);
        nxlToken = IERC20(_nxlToken);
        founder = _founder;
        stakingActive = false;
    }

    function setNexumManager(address _nexumManager) external onlyOwner {
        require(nexumManager == address(0), "Already set");
        require(_nexumManager != address(0), "Invalid address");
        
        nexumManager = _nexumManager;
        emit NexumManagerSet(_nexumManager);
    }

    function setStakingStatus(bool _active) external onlyOwner {
        stakingActive = _active;
        emit StakingStatusChanged(_active);
    }

    function receiveFunds() external {
        uint256 balance = stablecoin.balanceOf(address(this));
        uint256 newDeposit = balance - (totalDeposited - totalWithdrawnForStaking);
        
        if (newDeposit > 0) {
            totalDeposited += newDeposit;
            emit FundsReceived(msg.sender, newDeposit);
        }
    }

    function depositFunds(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(
            stablecoin.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        totalDeposited += amount;
        emit FundsReceived(msg.sender, amount);
    }

    function withdrawForStaking(uint256 amount) external onlyOwner {
        require(msg.sender == founder || msg.sender == owner(), "Only founder");
        require(stakingActive, "Staking not active");
        require(amount > 0, "Amount must be > 0");
        require(
            block.timestamp >= lastWithdrawalTime + MIN_WITHDRAWAL_INTERVAL,
            "Must wait 30 days"
        );
        
        uint256 availableBalance = stablecoin.balanceOf(address(this));
        require(availableBalance >= amount, "Insufficient balance");
        
        lastWithdrawalTime = block.timestamp;
        totalWithdrawnForStaking += amount;
        
        require(stablecoin.transfer(founder, amount), "Transfer failed");
        emit FundsWithdrawnForStaking(founder, amount);
    }

    function depositMonthlyRewards(uint256 rewardAmount) external onlyOwner {
        require(rewardAmount > 0, "Amount must be > 0");
        
        require(
            stablecoin.transferFrom(msg.sender, address(this), rewardAmount),
            "Transfer failed"
        );
        
        uint256 snapshotId = snapshotCount;
        uint256 totalSupply = nxlToken.totalSupply();
        
        rewardSnapshots[snapshotId] = RewardSnapshot({
            timestamp: block.timestamp,
            totalRewards: rewardAmount,
            totalNXLSupply: totalSupply,
            distributed: false
        });
        
        snapshotCount++;
        emit RewardsDeposited(snapshotId, rewardAmount);
    }

    function claimRewards(uint256 snapshotId) external nonReentrant {
        require(snapshotId < snapshotCount, "Invalid snapshot");
        require(!userClaimed[msg.sender][snapshotId], "Already claimed");
        
        RewardSnapshot memory snapshot = rewardSnapshots[snapshotId];
        require(snapshot.totalRewards > 0, "No rewards");
        
        uint256 userBalance = nxlToken.balanceOf(msg.sender);
        require(userBalance > 0, "No NXL balance");
        
        uint256 userReward = (snapshot.totalRewards * userBalance) / snapshot.totalNXLSupply;
        require(userReward > 0, "Reward too small");
        
        userClaimed[msg.sender][snapshotId] = true;
        totalClaimedByUser[msg.sender] += userReward;
        totalRewardsDistributed += userReward;
        
        require(stablecoin.transfer(msg.sender, userReward), "Transfer failed");
        emit RewardClaimed(msg.sender, snapshotId, userReward);
    }

    function claimMultipleRewards(uint256[] calldata snapshotIds) external nonReentrant {
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < snapshotIds.length; i++) {
            uint256 snapshotId = snapshotIds[i];
            
            if (snapshotId >= snapshotCount) continue;
            if (userClaimed[msg.sender][snapshotId]) continue;
            
            RewardSnapshot memory snapshot = rewardSnapshots[snapshotId];
            if (snapshot.totalRewards == 0) continue;
            
            uint256 userBalance = nxlToken.balanceOf(msg.sender);
            if (userBalance == 0) continue;
            
            uint256 userReward = (snapshot.totalRewards * userBalance) / snapshot.totalNXLSupply;
            if (userReward == 0) continue;
            
            userClaimed[msg.sender][snapshotId] = true;
            totalReward += userReward;
            
            emit RewardClaimed(msg.sender, snapshotId, userReward);
        }
        
        require(totalReward > 0, "No rewards");
        
        totalClaimedByUser[msg.sender] += totalReward;
        totalRewardsDistributed += totalReward;
        
        require(stablecoin.transfer(msg.sender, totalReward), "Transfer failed");
    }

    function getPendingRewards(address user, uint256 snapshotId) external view returns (uint256) {
        if (snapshotId >= snapshotCount) return 0;
        if (userClaimed[user][snapshotId]) return 0;
        
        RewardSnapshot memory snapshot = rewardSnapshots[snapshotId];
        if (snapshot.totalRewards == 0) return 0;
        
        uint256 userBalance = nxlToken.balanceOf(user);
        if (userBalance == 0) return 0;
        
        return (snapshot.totalRewards * userBalance) / snapshot.totalNXLSupply;
    }

    function getTotalPendingRewards(address user) external view returns (uint256 total) {
        for (uint256 i = 0; i < snapshotCount; i++) {
            if (userClaimed[user][i]) continue;
            
            RewardSnapshot memory snapshot = rewardSnapshots[i];
            if (snapshot.totalRewards == 0) continue;
            
            uint256 userBalance = nxlToken.balanceOf(user);
            if (userBalance == 0) continue;
            
            total += (snapshot.totalRewards * userBalance) / snapshot.totalNXLSupply;
        }
    }

    function getContractInfo() external view returns (
        uint256 balance,
        uint256 deposited,
        uint256 withdrawnForStaking,
        uint256 rewardsDistributed,
        uint256 snapshots,
        bool isStakingActive,
        uint256 lastWithdrawal,
        uint256 nextWithdrawalAvailable
    ) {
        uint256 nextAvailable = 0;
        if (lastWithdrawalTime > 0) {
            nextAvailable = lastWithdrawalTime + MIN_WITHDRAWAL_INTERVAL;
        }
        
        return (
            stablecoin.balanceOf(address(this)),
            totalDeposited,
            totalWithdrawnForStaking,
            totalRewardsDistributed,
            snapshotCount,
            stakingActive,
            lastWithdrawalTime,
            nextAvailable
        );
    }

    function getSnapshotInfo(uint256 snapshotId) external view returns (
        uint256 timestamp,
        uint256 totalRewards,
        uint256 totalSupply,
        bool distributed
    ) {
        require(snapshotId < snapshotCount, "Invalid snapshot");
        RewardSnapshot memory snapshot = rewardSnapshots[snapshotId];
        
        return (
            snapshot.timestamp,
            snapshot.totalRewards,
            snapshot.totalNXLSupply,
            snapshot.distributed
        );
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        uint256 balance = stablecoin.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        require(stablecoin.transfer(owner(), amount), "Transfer failed");
    }

    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(stablecoin), "Cannot recover stablecoin");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}
