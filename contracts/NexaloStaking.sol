// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * Staking de NXL con rewards en WBTC.
 * - stake/withdraw/claim/exit
 * - fundRewards SOLO puede llamarlo Treasury
 * - rewards lineales en el tiempo (duration configurable al deploy)
 */
contract NexaloStakingWBTC is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable nxl;
    IERC20 public immutable wbtc;
    address public immutable treasury;

    uint256 public totalStaked;

    mapping(address => uint256) public balanceOf;

    // ===== rewards accounting (Synthetix style) =====
    uint256 public rewardPerTokenStoredE18;
    uint256 public lastUpdateTime;
    uint256 public rewardRate; // WBTC per second
    uint256 public periodFinish;
    uint256 public rewardsDuration; // e.g. 30 days

    mapping(address => uint256) public userRewardPerTokenPaidE18;
    mapping(address => uint256) public rewards; // accrued WBTC

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    event RewardsFunded(uint256 amount, uint256 rewardRate, uint256 periodFinish);
    event RewardsDurationSet(uint256 duration);

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only treasury");
        _;
    }

    constructor(address _nxl, address _wbtc, address _treasury, uint256 _rewardsDuration) {
        require(_nxl != address(0) && _wbtc != address(0) && _treasury != address(0), "Bad params");
        require(_rewardsDuration >= 1 days && _rewardsDuration <= 365 days, "Bad duration");
        nxl = IERC20(_nxl);
        wbtc = IERC20(_wbtc);
        treasury = _treasury;
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationSet(_rewardsDuration);
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStoredE18;
        uint256 dt = lastTimeRewardApplicable() - lastUpdateTime;
        return rewardPerTokenStoredE18 + ((dt * rewardRate * 1e18) / totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        uint256 rpt = rewardPerToken();
        uint256 paid = userRewardPerTokenPaidE18[account];
        return rewards[account] + ((balanceOf[account] * (rpt - paid)) / 1e18);
    }

    function _updateReward(address account) internal {
        rewardPerTokenStoredE18 = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaidE18[account] = rewardPerTokenStoredE18;
        }
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount=0");
        _updateReward(msg.sender);

        totalStaked += amount;
        balanceOf[msg.sender] += amount;

        nxl.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant {
        require(amount > 0, "Amount=0");
        require(balanceOf[msg.sender] >= amount, "Insufficient stake");
        _updateReward(msg.sender);

        balanceOf[msg.sender] -= amount;
        totalStaked -= amount;

        nxl.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claim() public nonReentrant {
        _updateReward(msg.sender);

        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards");

        rewards[msg.sender] = 0;
        wbtc.safeTransfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }

    function exit() external {
        withdraw(balanceOf[msg.sender]);
        claim();
    }

    /// @notice Treasury deposita WBTC y arranca (o renueva) un periodo lineal de rewards.
    function fundRewards(uint256 amount) external onlyTreasury nonReentrant {
        require(amount > 0, "Amount=0");
        _updateReward(address(0));

        // trae WBTC desde treasury
        wbtc.safeTransferFrom(msg.sender, address(this), amount);

        // si hay periodo activo, agregamos leftover
        uint256 leftover = 0;
        if (block.timestamp < periodFinish) {
            uint256 remaining = periodFinish - block.timestamp;
            leftover = remaining * rewardRate;
        }

        uint256 total = amount + leftover;
        rewardRate = total / rewardsDuration;
        require(rewardRate > 0, "RewardRate=0");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;

        emit RewardsFunded(amount, rewardRate, periodFinish);
    }
}
