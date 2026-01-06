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

Usuario aprueba USDT

Llama a buyTickets(productId, quantity, referrer)
↓

Transferencia USDT → NexumManager

Asignación de tickets secuencial

Distribución de NXL al comprador

Registro de referrer (si aplica)
↓

Si ronda completa (1000 o 10000 tickets):
→ Solicitud Chainlink VRF
→ VRF selecciona ganador aleatorio
→ Distribución AUTOMÁTICA:

50% al ganador

10% a 10 ganadores instantáneos

10% a ReferralNetwork

10% a TreasuryBTC

5% a AmbassadorRegistry

15% a Operaciones
→ Nueva ronda inicia automáticamente


---

## 10. FAQ

**Q: ¿Es NEXALO una estafa?**  
A: No. Todo el código es open source, auditable y verificable en BSCScan. No hay backdoors ni funciones ocultas.

**Q: ¿Qué pasa si no se venden todos los tickets?**  
A: La ronda permanece abierta hasta completarse. No hay límite de tiempo.

**Q: ¿Puedo comprar múltiples tickets?**  
A: Sí, sin límite. Más tickets = más probabilidad de ganar.

**Q: ¿Cómo sé que el ganador es aleatorio?**  
A: Usamos Chainlink VRF, verificable on-chain. Nadie puede manipular el resultado.

**Q: ¿Qué pasa con los NXL cuando se agota el pool?**  
A: Los productos se desactivan y el remanente se quema (burning).

**Q: ¿Puedo vender mis NXL?**  
A: Sí, en DEX como PancakeSwap cuando haya liquidez.

**Q: ¿Hay límite en las ganancias?**  
A: No, puedes ganar múltiples veces.

**Q: ¿Es legal?**  
A: DeFi opera en zona gris regulatoria. Consulta leyes locales.

---

## 11. Conclusión

NEXALO representa la evolución natural de las loterías tradicionales hacia un modelo completamente descentralizado, transparente y autónomo. El sistema elimina intermediarios, reduce costos operativos a cero y garantiza distribución justa mediante smart contracts auditables.

**Ventajas clave:**
- ✅ 0% comisión de operadores
- ✅ 100% transparente on-chain
- ✅ Distribución instantánea
- ✅ Token con valor intrínseco
- ✅ Community-driven (futuro DAO)

**Próximos pasos:**
1. Auditoría completa ($3K)
2. Deploy Mainnet
3. Marketing y adopción
4. Expansión multi-chain
5. Governance descentralizada

---

## 12. Links

**Testnet:**
- NXLToken: `0x8a2ad88b3Fa1CcD9b451918eC953EFa94D270928`
- N
📋 PRÓXIMOS PASOS PARA MAINNET:
Paso 1: Auditoría ($3,000)
Recomendación: Techrate ($1,500-2,500)

Contacto: https://techrate.org

Anónimo: ✅ Sí

Tiempo: 5-10 días

Badge + Report público

Paso 2: Correcciones Post-Auditoría
Implementar recomendaciones

Re-test completo

Re-audit si es necesario

Paso 3: Deploy Mainnet
Chainlink VRF Subscription (Mainnet)

0.5-1 BNB para gas

Ejecutar scripts/redeploy-all.js --network bscMainnet

Paso 4: Verificación BSCScan
Actualizar hardhat.config.js con API key v2

Ejecutar scripts/verify-contracts.js

Paso 5: Frontend Producción
Actualizar config.js con direcciones Mainnet

Deploy en hosting

Conectar dominio

Paso 6: Marketing
Twitter/X announcement

CoinGecko listing

CMC listing

Telegram community

💰 INVERSIÓN TOTAL ESTIMADA:
text
Auditoría:           $2,500
Deploy Mainnet:      $50 (gas BNB)
Frontend hosting:    $10/mes
Marketing inicial:   $500-1,000
-----------------------------------
TOTAL:              ~$3,060 - $3,560
🎯 CHECKLIST PRE-MAINNET:
 Contratos desplegados en testnet

 Tests funcionales exitosos

 Documentación completa

 Auditoría externa contratada

 Correcciones implementadas

 Chainlink VRF Mainnet configurado

 Frontend producción listo

 Marketing plan definido

 Community setup (Telegram/Discord)

 Deploy en Mainnet

Todo está listo para la auditoría. Contacta a Techrate cuando estés preparado y tendrás NEXALO en Mainnet en 3-4 semanas.

¿Necesitas algo más antes de proceder con la auditoría?

12-12-24 ultimo deploy
🔄 REDESPLIEGUE COMPLETO NEXALO
======================================================================

📍 Información:
   Deployer: 0xA65d959d82DC2cc329950941D8e306347401CeBf
   Balance: 0.786172627532718279 BNB

1️⃣  Desplegando NXLToken...
   ✅ 0xC92708547059DA04167cBAd21f061eb233817d24

2️⃣  Desplegando NexumManager...
   ✅ 0xc94Fa66F408a7cb0617099FF75375C2CF7f5A193

3️⃣  Desplegando ReferralNetwork...
   ✅ 0x059564fEB4c20EC76A8A063a1649d9F49a4E137C

4️⃣  Desplegando AmbassadorRegistry...
   ✅ 0x73Ae26858dB417F9c39d9fC43375808281128240

5️⃣  Desplegando TreasuryBTC...
   ✅ 0x04d0a2Ffa12282488CA27aabB1C4bAcb11C7Dde8

6️⃣  Desplegando BuybackContract...
   ✅ 0x070803EE3E472739F43a016400E308d972607195

7️⃣  Configurando permisos...
   ✅ NexumManager configurado en NXLToken
   ✅ NexumManager configurado en ReferralNetwork
   ✅ Ecosistema configurado en NexumManager

8️⃣  Deployment guardado ✅

======================================================================
✅ REDESPLIEGUE COMPLETO EXITOSO
======================================================================

📋
🔄 REDESPLIEGUE COMPLETO NEXALO
======================================================================

📍 Información:
   Deployer: 0xA65d959d82DC2cc329950941D8e306347401CeBf
   Balance: 0.483613334492718279 BNB

1️⃣  Desplegando NXLToken...
   ✅ 0x60C4cDD67A0276C5Cb2a86eD1b06D4755baEa5E7

2️⃣  Desplegando NexumManager...
   ✅ 0x23289574750e53B40D5690f4066b4efCA2e35dcE

3️⃣  Desplegando ReferralNetwork...
   ✅ 0x444C72c82094127786cb5F6c5e7bba5304188231

4️⃣  Desplegando AmbassadorRegistry...
   ✅ 0x61b933B65a0fC6FCbF155188C758c9081c96b259

5️⃣  Desplegando TreasuryBTC...
   ✅ 0x7F3d960eA517a6282922f512077D37070E2c26a8

6️⃣  Desplegando BuybackContract...
   ✅ 0xfA983d07e3C855BFb93b49b33527c75ec02C235B

7️⃣  Configurando permisos...
   ✅ NexumManager configurado en NXLToken
   ✅ NexumManager configurado en ReferralNetwork
   ✅ Ecosistema configurado en NexumManager

8️⃣  Deployment guardado ✅

======================================================================
✅ REDESPLIEGUE COMPLETO EXITOSO
======================================================================

📋 Contratos desplegados:

   NXL Token:          0x60C4cDD67A0276C5Cb2a86eD1b06D4755baEa5E7
   NexumManager:       0x23289574750e53B40D5690f4066b4efCA2e35dcE
   ReferralNetwork:    0x444C72c82094127786cb5F6c5e7bba5304188231
   AmbassadorRegistry: 0x61b933B65a0fC6FCbF155188C758c9081c96b259
   TreasuryBTC:        0x7F3d960eA517a6282922f512077D37070E2c26a8
   BuybackContract:    0xfA983d07e3C855BFb93b49b33527c75ec02C235B

Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76

14.3 Recomendaciones Pre-Launch
Críticas (Hacer antes de mainnet)
✅ COMPLETADO: Verificación interna de distribuciones

✅ COMPLETADO: Tests en testnet con volumen real

🔄 PENDIENTE: Documentación pública completa

🔄 PENDIENTE: Terms of Service y Privacy Policy

🔄 PENDIENTE: Geoblocking de jurisdicciones restringidas

Altamente Recomendadas
🔄 PENDIENTE: Bug bounty privado ($500-2000 budget)

🔄 PENDIENTE: Multisig wallet para admin (Gnosis Safe)

🔄 PENDIENTE: Timelock para cambios críticos (24-48h)

🔄 PENDIENTE: Monitoreo 24/7 con alertas automáticas

🔄 PENDIENTE: Plan de respuesta a incidentes

Opcionales (Sin presupuesto)
⏸️ FUTURO: Auditoría externa profesional ($5K-$20K)

⏸️ FUTURO: Seguro de smart contracts ($2K-$10K/año)

⏸️ FUTURO: Penetration testing especializado

⏸️ FUTURO: Formal verification matemática

14.4 Plan de Lanzamiento Sugerido
Semana 1-2: Preparación Final
 Deploy en mainnet

 Verificar contratos en BscScan

 Configurar multisig (si es posible)

 Documentación pública

 Landing page profesional

Semana 3-4: Soft Launch
 Anuncio en círculo cercano

 Primeras 5-10 rondas con monitoreo intensivo

 Ajustes basados en feedback

 Bug bounty privado activo

Mes 2: Public Launch
 Marketing en redes sociales

 Partnerships con influencers

 Listado en agregadores

 Primeras liquidez pools de NXL

Mes 3+: Crecimiento
 Expansión de productos

 Staking de NXL

 Governance inicial

 Auditoría externa (cuando haya ingresos)/
PS C:\Users\bigcrt\Desktop\NEXALO>/15/12/2025
14.3 Recomendaciones Pre-Launch
Críticas (Hacer antes de mainnet)
✅ COMPLETADO: Verificación interna de distribuciones

✅ COMPLETADO: Tests en testnet con volumen real

🔄 PENDIENTE: Documentación pública completa

🔄 PENDIENTE: Terms of Service y Privacy Policy

🔄 PENDIENTE: Geoblocking de jurisdicciones restringidas

Altamente Recomendadas
🔄 PENDIENTE: Bug bounty privado ($500-2000 budget)

🔄 PENDIENTE: Multisig wallet para admin (Gnosis Safe)

🔄 PENDIENTE: Timelock para cambios críticos (24-48h)

🔄 PENDIENTE: Monitoreo 24/7 con alertas automáticas

🔄 PENDIENTE: Plan de respuesta a incidentes

Opcionales (Sin presupuesto)
⏸️ FUTURO: Auditoría externa profesional ($5K-$20K)

⏸️ FUTURO: Seguro de smart contracts ($2K-$10K/año)

⏸️ FUTURO: Penetration testing especializado

⏸️ FUTURO: Formal verification matemática

14.4 Plan de Lanzamiento Sugerido
Semana 1-2: Preparación Final
 Deploy en mainnet

 Verificar contratos en BscScan

 Configurar multisig (si es posible)

 Documentación pública

 Landing page profesional

Semana 3-4: Soft Launch
 Anuncio en círculo cercano

 Primeras 5-10 rondas con monitoreo intensivo

 Ajustes basados en feedback

 Bug bounty privado activo

Mes 2: Public Launch
 Marketing en redes sociales

 Partnerships con influencers

 Listado en agregadores

 Primeras liquidez pools de NXL

Mes 3+: Crecimiento
 Expansión de productos

 Staking de NXL

 Governance inicial

 Auditoría externa (cuando haya ingresos)