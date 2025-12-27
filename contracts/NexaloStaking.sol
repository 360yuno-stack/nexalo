// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexaloStaking
 * @notice Stake NXL, rewards en WBTC (funded, pro-rata).
 * @dev Fix auditoría: elimina APY fijo y conversión hardcodeada.
 */
contract NexaloStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable nxl;
    IERC20 public immutable wbtc;

    uint256 public totalStaked;
    uint256 public accRewardPerShareE18; // scaled 1e18
    uint256 public constant ACC = 1e18;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt; // amount*acc - already accounted
        uint256 totalClaimed;
    }

    mapping(address => UserInfo) public users;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount);
    event Claimed(address indexed user, uint256 amount);

    constructor(address _nxl, address _wbtc) Ownable(msg.sender) {
        require(_nxl != address(0) && _wbtc != address(0), "Invalid token");
        nxl = IERC20(_nxl);
        wbtc = IERC20(_wbtc);
    }

    function pendingRewards(address user) public view returns (uint256) {
        UserInfo memory u = users[user];
        if (u.amount == 0) return 0;
        uint256 accumulated = (u.amount * accRewardPerShareE18) / ACC;
        if (accumulated <= u.rewardDebt) return 0;
        return accumulated - u.rewardDebt;
    }

    function _updateDebt(address user) private {
        UserInfo storage u = users[user];
        u.rewardDebt = (u.amount * accRewardPerShareE18) / ACC;
    }

    function fundRewards(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount=0");
        require(totalStaked > 0, "No stakers");

        wbtc.safeTransferFrom(msg.sender, address(this), amount);
        accRewardPerShareE18 += (amount * ACC) / totalStaked;

        emit RewardsFunded(msg.sender, amount);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount=0");

        // claim pending first
        _claim(msg.sender);

        nxl.safeTransferFrom(msg.sender, address(this), amount);

        UserInfo storage u = users[msg.sender];
        u.amount += amount;
        totalStaked += amount;

        _updateDebt(msg.sender);

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount=0");
        UserInfo storage u = users[msg.sender];
        require(u.amount >= amount, "Insufficient staked");

        _claim(msg.sender);

        u.amount -= amount;
        totalStaked -= amount;

        _updateDebt(msg.sender);

        nxl.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        _claim(msg.sender);
        _updateDebt(msg.sender);
    }

    function _claim(address user) private {
        uint256 amt = pendingRewards(user);
        if (amt == 0) {
            _updateDebt(user);
            return;
        }
        users[user].totalClaimed += amt;
        _updateDebt(user);
        wbtc.safeTransfer(user, amt);
        emit Claimed(user, amt);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(nxl) && token != address(wbtc), "Protected");
        IERC20(token).safeTransfer(owner(), amount);
    }
}
