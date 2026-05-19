# Security Policy — NEXALO Protocol

## Scope

This policy covers all smart contracts in `contracts/`:
- `NexumManager.sol` — core lottery/raffle engine
- `NXLToken.sol` — protocol token (ERC20 + snapshot)
- `TreasuryBTC.sol` — USDT accumulation and WBTC rewards
- `NexaloStaking.sol` — NXL staking with WBTC rewards
- `ReferralNetwork.sol` — 3-level referral commission logic
- `AmbassadorRegistry.sol` — ambassador fund distribution
- `NexaloStaking.sol` — NXL staking

Out of scope: frontend interfaces, off-chain bots, third-party integrations (Chainlink, Transak).

---

## Audit History

| Firm | Date | Scope | Report |
|---|---|---|---|
| Zealynx Security | 2026-04 | NexumManager, NXLToken, TreasuryBTC | `auditor_rebuttal.md`, `auditor_rebuttal_v2.md` |
| Internal review (audit-fixes-clean branch) | 2026-05 | All contracts post-remediation | `nexalo_auditoria.zip` |

---

## Zealynx Findings — Status

### 🔴 Critical / High

| ID | Title | Status |
|---|---|---|
| H-01 | NXL exhaustion blocks ticket purchases (DoS) | ✅ **Fixed** — NXL check moved to round-start (`_checkNXLForNewRound`); purchase gate removed |
| H-02 | Ticket ownership overwrite between `buyTickets` and `buySpecificTickets` | ✅ **Fixed** — Lazy Fisher-Yates with O(1) slot verification; `ticketOwner[..] == address(0)` enforced in `buySpecificTickets` |
| H-03 | Winner selection from empty ticket slots (`address(0)`) | ✅ **Fixed** — `ticketsSold == maxTickets` invariant enforced before VRF; fallback loop removed (P-01, 2026-05) |

### 🟡 Medium

| ID | Title | Status |
|---|---|---|
| M-01 | TreasuryBTC double-claiming via live `balanceOf` | ✅ **Fixed** — snapshot-based (`balanceOfAt`); `claimedByUserGross` per-snapshot-per-user |
| M-02 | Referral chain griefing (ReferralNetwork) | ✅ **Fixed** — commission distributor wrapped in try/catch; leftover goes to prizePot |
| M-09 | NexaloStaking rewards can exceed WBTC pool | ✅ **Fixed** — MasterChef-style `accRewardPerShareE18`; `toPay = min(owed, available)` |

### 🟢 Low / Acknowledged

| ID | Title | Status |
|---|---|---|
| L-01 | `_randomIndex` uses `blockhash` for ticket assignment | ✅ **Acknowledged** — Only affects ticket number drawn, NOT the winner (Chainlink VRF). MEV-hardened with per-round nonce + `block.prevrandao` |
| L-02 | Gas cost of VRF callback under high investor load | ✅ **Fixed** — `MAX_INVESTORS_PER_SETTLEMENT = 100`; `continueSettlement()` for pagination |

---

## Post-Zealynx Self-Identified Fixes (2026-05)

| ID | Description | Commit |
|---|---|---|
| P-01 | Removed O(maxTickets) fallback loop in `fulfillRandomWords` | `main` post-audit |
| P-02 | Replaced O(N) pagination re-iteration with stored residuals (`settleRemainingPrincipal/Profit`) | `main` post-audit |
| P-04 | Replaced fragile `claimableStable`-based `manualSettle` guard with dedicated `roundPrizeAccrued` flag (CEI) | `main` post-audit |

---

## Known Residual Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Chainlink VRF LINK balance depletes | Medium | `resolveStuckRound()` after 7-day timeout; operational monitoring required |
| `_randomIndex` MEV for ticket number (not winner) | Low | Per-round nonce + blockhash + prevrandao; winner is VRF-only |
| Admin keys pre-`finalizeAutonomy()` | High | Operational: use MultiSig (Gnosis Safe); call `finalizeAutonomy()` immediately after ecosystem setup |

---

## Architecture Security Properties

1. **Pull payments only** — `claimableStable` / `claimableNXL` mappings; users pull individually
2. **Autonomous post-finalization** — `finalizeAutonomy()` calls `renounceOwnership()`; no admin access after
3. **Bounded loops** — all critical loops have O(1) or `MAX_*` hard caps
4. **CEI pattern** — all state changes happen before external calls
5. **SafeERC20** everywhere — no raw `.transfer()` or `.call{value}()`
6. **VRF-only winner selection** — Chainlink VRF v2; block variables never used for prize randomness

---

## Responsible Disclosure

If you discover a vulnerability:

1. **Do NOT disclose publicly** before contacting us
2. Email: security@nexalo.io (or open a private GitHub Security Advisory)
3. Include: contract name, function, PoC (if available), severity assessment
4. We commit to responding within 48 hours

Bug bounty program: to be announced at Mainnet launch.

---

## Deployment Addresses (Mainnet)

> To be updated at Mainnet launch — see `frontend/config.js`

| Contract | BSC Mainnet Address |
|---|---|
| NexumManager | TBD |
| NXLToken | TBD |
| TreasuryBTC | TBD |
| NexaloStaking | TBD |
| ReferralNetwork | TBD |
| AmbassadorRegistry | TBD |
