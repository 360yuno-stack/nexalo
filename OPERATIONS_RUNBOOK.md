# Nexalo Protocol: Incident Response & Operations Runbook

This document outlines the standard operating procedures (SOPs) for the Nexalo Guardian and Operations Multisig during mainnet anomalies, liveness degradation, and systemic emergencies.

## 1. VRF Callback Failure (Liveness Degradation)
**Trigger:** Chainlink VRF fails to return randomness within 24 hours of a round closing, causing the round to appear "stuck".
**Impact:** Settlement starvation. Users cannot claim prizes, and the next round cannot begin.
**Procedure:**
1. **Monitor:** Ensure the `VRFRequested` event was emitted. Check Chainlink VRF dashboard for node outages or gas-price spikes preventing fulfillment.
2. **Wait for Timeout:** The protocol has a hardcoded 7-day timeout.
3. **Resolve:** After exactly 7 days, ANY user or the Operations bot can call `resolveStuckRound(productId, roundId)`.
4. **Action:** This function safely requests a NEW random word from Chainlink without losing state, effectively bypassing the stuck request.

## 2. Extreme Gas Spikes (Gas Market Adversarial Conditions)
**Trigger:** BSC network experiences extreme congestion (e.g., gas > 5000 gwei), making ticket purchases or claims economically unviable.
**Impact:** Economic latency. Small ticket buyers are priced out.
**Procedure:**
1. **No Panic:** The protocol does not rely on time-sensitive liquidations. If a user cannot claim a prize today, the funds remain safely backed in `claimableStable` indefinitely.
2. **Guardian Action:** If the spike is paired with an active exploit attempt, the Guardian MUST call `emergencyPause()`.
3. **Resolution:** Wait for gas prices to normalize. The Guardian calls `emergencyUnpause()`.

## 3. Treasury Insolvency Threat / Exploit Detection
**Trigger:** Off-chain invariant monitoring detects `totalAssets < totalLiabilities`, or an unexpected drain of USDT is occurring.
**Impact:** Loss of user funds.
**Procedure:**
1. **IMMEDIATE HALT:** The Guardian wallet MUST execute `emergencyPause()` immediately.
   - This disables `buyTickets`, `claimStable`, and `claimNXL`.
   - Reverts all ongoing transactions interacting with NexumManager.
2. **Audit:** The protocol remains paused while the multisig reviews the transaction history to identify the bug.
3. **Resolution:** If the protocol is permanently compromised (highly unlikely due to immutability), the `owner` (if not renounced) or the community must fork the state. If it was a false alarm, `emergencyUnpause()`.

## 4. Front-End / RPC Outage
**Trigger:** The main Nexalo dashboard goes down or the configured RPC node is unresponsive.
**Impact:** Users panic because they cannot interact with the protocol.
**Procedure:**
1. **Direct Contract Interaction:** Nexalo contracts are verified on BscScan. Publish a guide on Twitter/Telegram on how users can call `claimStable()` directly via BscScan's "Write Contract" tab using MetaMask.
2. **RPC Fallback:** Ensure the frontend has an array of fallback public BSC RPCs configured.

---
*Operational resilience requires calm, deterministic responses to chaotic market conditions.*
