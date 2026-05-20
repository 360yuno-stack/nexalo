// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title NexaloStaking
 * @author Nexalo Team
 * @notice Stake NXL, rewards en WBTC (funded, pro-rata).
 * @dev Fix auditoría [M-09]:
 *  - Nunca revierte stake/unstake/claim por falta de WBTC.
 *  - Si Treasury fondea cuando no hay stakers, se guarda en buffer y se distribuye luego.
 */
contract NexaloStaking is ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable nxl;
    IERC20 public immutable wbtc;

    uint256 public totalStaked;
    uint256 public accRewardPerShareE18; // scaled 1e18
    uint256 public constant ACC = 1e18;

    // NUEVO: WBTC fondeado cuando no hay stakers (o cuando no se pudo distribuir)
    uint256 public fundedButUndistributed;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 totalClaimed;
        uint256 unpaidRewards; // deuda acumulada si no hay WBTC suficiente
    }

    mapping(address => UserInfo) public users;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsFunded(address indexed funder, uint256 amount);
    event BufferedRewards(address indexed funder, uint256 amount);
    event DistributedBufferedRewards(uint256 amount);
    event Claimed(address indexed user, uint256 amount);

    constructor(address _nxl, address _wbtc) Ownable(msg.sender) {
        require(_nxl != address(0) && _wbtc != address(0), "Invalid token");
        nxl = IERC20(_nxl);
        wbtc = IERC20(_wbtc);
    }

    function pendingRewards(address user) public view returns (uint256) {
        UserInfo memory u = users[user];
        if (u.amount == 0) return u.unpaidRewards;

        uint256 accumulated = (u.amount * accRewardPerShareE18) / ACC;
        if (accumulated <= u.rewardDebt) return u.unpaidRewards;

        return (accumulated - u.rewardDebt) + u.unpaidRewards;
    }

    function _updateDebt(address user) private {
        UserInfo storage u = users[user];
        u.rewardDebt = (u.amount * accRewardPerShareE18) / ACC;
    }

    function _distributeBufferedIfPossible() private {
        if (fundedButUndistributed == 0) return;
        if (totalStaked == 0) return;

        uint256 amt = fundedButUndistributed;
        fundedButUndistributed = 0;

        accRewardPerShareE18 += (amt * ACC) / totalStaked;
        emit DistributedBufferedRewards(amt);
    }

    /**
     * @notice Fondea rewards en WBTC. Puede llamar TreasuryBTC.
     * @dev Si no hay stakers, se guarda en buffer (no revierte).
     */
    function fundRewards(uint256 amount) external nonReentrant {
        require(amount != 0, "Amount=0");

        // Pull WBTC from funder
        wbtc.safeTransferFrom(msg.sender, address(this), amount);

        if (totalStaked == 0) {
            fundedButUndistributed += amount;
            emit BufferedRewards(msg.sender, amount);
        } else {
            accRewardPerShareE18 += (amount * ACC) / totalStaked;
            emit RewardsFunded(msg.sender, amount);
        }
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount != 0, "Amount=0");

        // primero distribuye buffer si ya hay stakers (por si justo se quedó pendiente)
        _distributeBufferedIfPossible();

        // claim pending first (sin DOS)
        _claim(msg.sender);

        nxl.safeTransferFrom(msg.sender, address(this), amount);

        UserInfo storage u = users[msg.sender];
        u.amount += amount;
        totalStaked += amount;

        // si este es el primer staker, ahora sí podemos distribuir el buffer
        _distributeBufferedIfPossible();

        _updateDebt(msg.sender);

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount != 0, "Amount=0");
        UserInfo storage u = users[msg.sender];
        require(u.amount >= amount, "Insufficient staked");

        _distributeBufferedIfPossible();

        // claim pending first (sin DOS)
        _claim(msg.sender);

        u.amount -= amount;
        totalStaked -= amount;

        _updateDebt(msg.sender);

        nxl.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        _distributeBufferedIfPossible();
        _claim(msg.sender);
        _updateDebt(msg.sender);
    }

    function _claim(address user) private {
        UserInfo storage u = users[user];

        // calcula el “nuevo pending” desde accRewardPerShareE18
        uint256 newPending = 0;
        if (u.amount != 0) {
            uint256 accumulated = (u.amount * accRewardPerShareE18) / ACC;
            if (accumulated >= u.rewardDebt + 1) {
                newPending = accumulated - u.rewardDebt;
            }
        }

        uint256 totalOwed = u.unpaidRewards + newPending;
        if (totalOwed == 0) {
            _updateDebt(user);
            return;
        }

        uint256 available = wbtc.balanceOf(address(this));
        uint256 toPay = totalOwed > available ? available : totalOwed;

        // guarda lo que queda como deuda
        u.unpaidRewards = totalOwed - toPay;

        if (toPay != 0) {
            u.totalClaimed += toPay;
            wbtc.safeTransfer(user, toPay);
            emit Claimed(user, toPay);
        }

        // IMPORTANT: actualiza debt después de contabilizar newPending
        _updateDebt(user);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(nxl) && token != address(wbtc), "Protected");
        IERC20(token).safeTransfer(owner(), amount);
    }
}


