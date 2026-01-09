#!/bin/bash

# Asegúrate de estar en la raíz de tu repo

# Paso 1: Crea y cambia a la rama de fixes
git checkout main
git pull
git checkout -b audit-fixes

# Commit 1: C-01
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): Elimina private key de .env - C-01

Closes #12
"

# Commit 2: C-02
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): Valida NXL antes de compra de ticket - C-02

Closes #13
"

# Commit 3: C-03
git add contracts/TreasuryBTC.sol
git commit -m "fix(TreasuryBTC): Lógica snapshot claimRewards eliminada - C-03

Closes #14
"

# Commit 4: H-01
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): Evita sobrescritura de tickets - H-01

Closes #15
"

# Commit 5: H-02
git add contracts/NexaloStaking.sol
git commit -m "fix(NexaloStaking): Recompensa WBTC solo pro-rata, elimina APY - H-02

Closes #16
"

# Commit 6: H-03
git add contracts/ReferralNetwork.sol
git commit -m "fix(ReferralNetwork): Remanente referidos regresa a prizePot - H-03

Closes #17
"

# Commit 7: H-04
git add contracts/TreasuryBTC.sol
git commit -m "fix(TreasuryBTC): Calculo de circulating supply corregido - H-04

Closes #18
"

# Commit 8: H-05
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): Algoritmo tickets sin huecos/duplicados - H-05

Closes #19
"

# Commit 9: M-01
git add contracts/TreasuryBTC.sol
git commit -m "fix(TreasuryBTC): Mejor control de acceso - M-01

Closes #20
"

# Commit 10: M-02
git add contracts/AmbassadorRegistry.sol
git commit -m "fix(AmbassadorRegistry): Solo pull en pagos, sin revert - M-02

Closes #21
"

# Commit 11: M-03
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): fulfillRandomWords no revierte nunca - M-03

Closes #22
"

# Commit 12: M-04
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): Distribución parcial NXL bajo control - M-04

Closes #23
"

# Commit 13: M-05
git add contracts/TreasuryBTC.sol
git commit -m "fix(TreasuryBTC): Accounting reescrito, tracking entradas/salidas - M-05

Closes #24
"

# Commit 14: M-06
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): VRF stuck fallback permissionless - M-06

Closes #25
"

# Commit 15: M-07
git add contracts/TreasuryBTC.sol
git commit -m "fix(TreasuryBTC): Audit funds solo configurable antes autonomía - M-07

Closes #26
"

# Commit 16: M-08
git add contracts/NXLToken.sol
git commit -m "fix(NXLToken): Burn solo rewards disponibles - M-08

Closes #27
"

# Commit 17: M-09
git add contracts/NexaloStaking.sol
git commit -m "fix(NexaloStaking): Chequeo de supply en distribución - M-09

Closes #28
"

# Commit 18: M-10
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): NXL reward fail-safe, desactiva producto si falla - M-10

Closes #29
"

# Commit 19: L-01
git add contracts/NexumManager.sol contracts/TreasuryBTC.sol contracts/AmbassadorRegistry.sol contracts/ReferralNetwork.sol
git commit -m "fix(All): Uso estricto de SafeERC20 OZ - L-01

Closes #30
"

# Commit 20: L-02
git add contracts/NexumManager.sol contracts/TreasuryBTC.sol
git commit -m "fix(All): Fondos de emergencia split claros - L-02

Closes #31
"

# Commit 21: L-03
git add contracts/NexumManager.sol contracts/TreasuryBTC.sol
git commit -m "fix(All): Inicialización estricta de variables - L-03

Closes #32
"

# Commit 22: L-04
git add contracts/NexumManager.sol
git commit -m "fix(NexumManager): Excluye ganador de instant rewards - L-04

Closes #33
"

# Sube la rama al repo remoto
git push --set-upstream origin audit-fixes

echo "¡Todos los fixes y commits hechos! Sube tu PDF y crea el Pull Request en GitHub."
