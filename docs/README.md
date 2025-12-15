# NEXALO - Sistema Autónomo de Lotería Descentralizada

## 🎯 Descripción

NEXALO es un protocolo de lotería descentralizada 100% autónomo en BSC (Binance Smart Chain) que combina:

- ✅ 6 productos de lotería (FLASH a BLACKBLOK)
- ✅ Token deflacionario NXL con sistema de recompensas
- ✅ Distribución automática de fondos (sin intervención humana)
- ✅ Sistema de referidos multinivel (3 niveles)
- ✅ Aleatoriedade verificable (Chainlink VRF)
- ✅ Tesorería DAO en BTC
- ✅ Programa de buyback automático

## 📊 Arquitectura del Sistema

### Contratos Principales

#### 1. **NXLToken** (ERC20)
- **Supply inicial:** 100M NXL
- **Distribución:**
  - 96M → REWARDS_POOL (96%)
  - 3M → Fundador con vesting 2 años (3%)
  - 1M → Partner con vesting 1 año (1%)
- **Características:**
  - Deflacionario (burning automático)
  - Rewards pool agotable
  - Función `distributeReward()` solo para NexumManager

#### 2. **NexumManager** (Core)
- **Función:** Sistema de lotería con 6 productos
- **Productos:**

| ID | Nombre | Precio | Tickets | Premio | NXL/ticket |
|----|--------|--------|---------|--------|------------|
| 0 | FLASH | $1 | 1,000 | $500 | 0.1 |
| 1 | ORIGINAL | $1 | 10,000 | $5,000 | 0.25 |
| 2 | PREMIUM | $20 | 1,000 | $10,000 | 0.50 |
| 3 | ELITE | $10 | 10,000 | $50,000 | 0.55 |
| 4 | VIP | $200 | 1,000 | $100,000 | 0.85 |
| 5 | BLACKBLOK | $200 | 10,000 | $1M | 1.0 |

- **Distribución automática (cuando se completa ronda):**
  - 50% → Premio al ganador
  - 10% → Airdrops instantáneos (10 ganadores aleatorios)
  - 10% → Sistema multinivel (5% + 3% + 2%)
  - 10% → Treasury DAO (BTC)
  - 5% → Embajadores
  - 15% → Operaciones (fundador 10%, partner 3%, buyback 2%)

#### 3. **ReferralNetwork**
- **Niveles:** 3 (5% + 3% + 2% del 10% total)
- **Protecciones:**
  - Anti-ciclos
  - Validación de direcciones
  - Un solo referrer por usuario

#### 4. **AmbassadorRegistry**
- **Función:** Registro de embajadores
- **Distribución:** Equitativa entre activos
- **Control:** Solo owner puede registrar

#### 5. **TreasuryBTC**
- **Función:** Acumulación del 10% para DAO
- **Objetivo:** Convertir a WBTC/BTC

#### 6. **BuybackContract**
- **Función:** Acumular 2% para recompra de NXL
- **Efecto:** Burning → deflación

## 🔄 Flujo de Compra

