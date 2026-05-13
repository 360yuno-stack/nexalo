# Nexalo Protocol: Threat Model & Architecture Security

This document addresses advanced economic, systemic, and operational risks as defined by institutional-grade auditing standards. Nexalo is designed as an immutable, minimized-attack-surface protocol.

## 1. Upgradeability & Proxy Risks (🟢 N/A)
**Risk:** Storage corruption, delegatecall exploits, initializer bugs, and slot collisions.
**Nexalo Architecture:** Nexalo **DOES NOT** use proxies or upgradeable contracts (`delegatecall`). The contracts are 100% immutable. The attack surface associated with upgradeability is non-existent.

## 2. Governance Capture & Voting Manipulation (🟢 N/A)
**Risk:** Quorum manipulation, vote borrowing (Flash Loans), malicious proposal execution.
**Nexalo Architecture:** Nexalo **DOES NOT** utilize on-chain token-based governance voting. Administration is handled via a multisig `DonationVault` protected by a strict **2-day Timelock**. Flash loan governance attacks are structurally impossible.

## 3. Silent Insolvency & Precision Drift (🟡 Mitigated)
**Risk:** Total liabilities exceeding total reserves due to compounding errors, precision drift, or rounding asymmetry.
**Nexalo Architecture:** 
- Nexalo operates on absolute integer math strictly tied to input funds. Funds are not minted or printed via compounding math. 
- A ticket purchase of `X USDT` results in a direct percentage allocation (e.g., 50% Prize, 10% Instant, 10% Treasury). 
- All funds sit natively in the contract mapping `claimableStable`. 
- **Invariant Guarantee:** `sum(claimableStable) + prizePot + instantPot <= address(this).balance`
- Any unallocated funds (e.g., incomplete referral trees) "spill over" directly into the `prizePot`, preventing leaked value.

## 4. Advanced MEV & Oracle Manipulation (🟡 Mitigated)
**Risk:** Sandwich timing, oracle latency abuse, validator grinding.
**Nexalo Architecture:** 
- Randomness is securely sourced via **Chainlink VRF v2**, meaning block builders cannot grind block timestamps or hashes to manipulate the winner.
- **Censorship Fallback:** If a malicious validator or Chainlink node censors the VRF callback, Nexalo incorporates a `resolveStuckRound` function with a 7-day timeout. This forces a VRF re-request rather than defaulting to insecure pseudo-randomness.

## 5. Flash Loan Economic Exploits (🟡 Mitigated)
**Risk:** Flash borrowing assets to manipulate reward snapshots or liquidity ratios.
**Nexalo Architecture:** 
- The `TreasuryBTC` contract uses a strict snapshot mechanism for NXL redemption. The `totalNXL` snapshot is taken *before* the redemption window opens. 
- Any NXL minted or flash-loaned *after* the window opens is ineligible for redemption, eliminating flash-loan arbitrage on the Treasury reserve.

## 6. Operational Risk & Emergency Systems (🟢 Active)
**Risk:** Exploits occurring rapidly without intervention capability.
**Nexalo Architecture:** 
- The `NexumManager` incorporates a specific `pauseGuardian` role. This role CANNOT extract funds or alter logic; it can ONLY trigger `emergencyPause()` to halt purchases and claims if an anomaly is detected.
- The `Checks-Effects-Interactions` pattern is strictly enforced across all user-facing endpoints.
- `ReentrancyGuard` protects all outbound asset transfers.

---
*Nexalo is built for resilience. Complexity is the enemy of security.*
