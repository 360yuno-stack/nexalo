// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AmbassadorRegistry
 * @notice Gestiona el programa de embajadores de NEXALO.
 * @dev El 5% de cada compra de tickets se distribuye entre embajadores activos
 *      usando un modelo acum-per-active (pull payments).
 *
 *  Flujo:
 *   1. Owner aprueba un embajador con `approveAmbassador(addr, name)`.
 *   2. NexumManager transfiere fondos al contrato.
 *   3. Cualquiera llama `distributeFunds()` para actualizar accRewardPerActive.
 *   4. Embajadores llaman `claim()` para retirar sus recompensas.
 *
 *  Seguridad:
 *   - Pull payments (sin push): no puede bloquearse por blacklist.
 *   - Las rewards se cristalizan al desactivar un embajador (no se pierden).
 */
contract AmbassadorRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;

    struct Ambassador {
        bool active;
        uint256 totalClaimed;
        uint256 rewardDebtE18;   // snapshot de accRewardPerActiveE18
        uint256 storedRewards;   // rewards acumuladas ya cristalizadas (no se pierden al cambiar status)
        string name;
    }

    mapping(address => Ambassador) public ambassadors;
    uint256 public activeCount;

    uint256 public accRewardPerActiveE18;
    uint256 public lastBalance;

    event AmbassadorRegistered(address indexed ambassador, string name);
    event AmbassadorStatusChanged(address indexed ambassador, bool active);
    event FundsDistributed(uint256 newFunds, uint256 activeCount, uint256 accRewardPerActiveE18);
    event Claimed(address indexed ambassador, uint256 amount);

    constructor(address _stablecoin) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        stablecoin = IERC20(_stablecoin);
        lastBalance = stablecoin.balanceOf(address(this));
    }

    // ── Owner-gated registration ──────────────────────────────────────────

    /// @notice Registra (o auto-registra con aprobación previa) un embajador.
    /// @dev El owner puede pre-aprobar direcciones; la dirección aprobada luego
    ///      confirma su registro llamando a este método.
    mapping(address => bool) public approvedForRegistration;

    /// @notice Aprueba una dirección para que pueda registrarse como embajador.
    function approveForRegistration(address candidate) external onlyOwner {
        require(candidate != address(0), "Invalid address");
        approvedForRegistration[candidate] = true;
    }

    /// @notice Revoca la aprobación (antes de que el candidato se registre).
    function revokeApproval(address candidate) external onlyOwner {
        approvedForRegistration[candidate] = false;
    }

    /// @notice El candidato aprobado se registra como embajador activo.
    function selfRegister(string calldata name) external {
        require(approvedForRegistration[msg.sender], "Not approved");
        require(bytes(name).length > 0 && bytes(name).length <= 64, "Invalid name");
        Ambassador storage a = ambassadors[msg.sender];
        require(bytes(a.name).length == 0, "Already registered");

        ambassadors[msg.sender] = Ambassador({
            active: true,
            totalClaimed: 0,
            rewardDebtE18: accRewardPerActiveE18,
            storedRewards: 0,
            name: name
        });

        approvedForRegistration[msg.sender] = false; // consume la aprobación
        activeCount += 1;
        emit AmbassadorRegistered(msg.sender, name);
    }

    function setAmbassadorStatus(address ambassador, bool active) external onlyOwner nonReentrant {
        require(ambassador != address(0), "Invalid address");
        Ambassador storage a = ambassadors[ambassador];
        require(bytes(a.name).length > 0, "Not registered");
        if (a.active == active) return;

        // CRISTALIZA lo pendiente antes de cambiar status (para que no se pierda)
        uint256 pendingNow = _pendingOnly(a);
        if (pendingNow > 0) {
            a.storedRewards += pendingNow;
        }

        a.rewardDebtE18 = accRewardPerActiveE18;

        a.active = active;
        if (active) activeCount += 1;
        else activeCount -= 1;

        emit AmbassadorStatusChanged(ambassador, active);
    }

    function distributeFunds() external nonReentrant {
        uint256 bal = stablecoin.balanceOf(address(this));
        require(bal > lastBalance, "No new funds");
        require(activeCount > 0, "No active ambassadors");

        uint256 delta = bal - lastBalance;
        accRewardPerActiveE18 += (delta * 1e18) / activeCount;
        lastBalance = bal;

        emit FundsDistributed(delta, activeCount, accRewardPerActiveE18);
    }

    /// @notice Calcula las recompensas pendientes (no cristalizadas) de un embajador activo.
    /// @dev Mantiene la precisión E18 hasta el momento del pago para evitar truncamiento prematuro.
    function _pendingOnly(Ambassador memory a) private view returns (uint256) {
        if (bytes(a.name).length == 0) return 0;
        if (!a.active) return 0; // inactivos no acumulan nuevas rewards
        if (accRewardPerActiveE18 <= a.rewardDebtE18) return 0;
        // Mantener precisión E18: dividir solo al momento del pago
        return (accRewardPerActiveE18 - a.rewardDebtE18) / 1e18;
    }

    function pendingRewards(address ambassador) public view returns (uint256) {
        Ambassador memory a = ambassadors[ambassador];
        return a.storedRewards + _pendingOnly(a);
    }

    function claim() external nonReentrant {
        Ambassador storage a = ambassadors[msg.sender];
        require(bytes(a.name).length > 0, "Not registered");

        uint256 pendingNow = _pendingOnly(a);
        uint256 amt = a.storedRewards + pendingNow;
        require(amt > 0, "Nothing to claim");

        // actualiza estado antes de transfer (pull)
        a.storedRewards = 0;
        a.rewardDebtE18 = accRewardPerActiveE18;
        a.totalClaimed += amt;

        uint256 bal = stablecoin.balanceOf(address(this));
        require(bal >= amt, "Insufficient balance");
        lastBalance = bal - amt;

        stablecoin.safeTransfer(msg.sender, amt);
        emit Claimed(msg.sender, amt);
    }
}
