# Respuesta Técnica Oficial (Parte 2) - Frontend & VRF Avanzado

Estimado equipo de Auditoría,

Agradecemos su exhaustivo análisis. Tras revisar sus últimos comentarios sobre el frontend y la resiliencia del VRF, hemos identificado un **malentendido fundamental respecto a la base de código que están auditando**.

Los problemas que describen sobre la arquitectura monolítica (todo en `index.html`), el uso masivo de `alert()`, el "stub" de WalletConnect y el *polling* manual cada 15 segundos **pertenecen a nuestra carpeta heredada `frontend/`**. Esa carpeta fue un prototipo MVP en Vanilla JS y **NO es el frontend de producción**.

El frontend institucional real que irá a Mainnet se encuentra en la carpeta **`frontend-v2/`**. Por favor, revisen esa carpeta en el archivo `.zip` que les enviamos. 

A continuación respondemos a sus preguntas basándonos en la arquitectura real de producción (`frontend-v2` y `NexumManager`):

---

## 1. Aclaración sobre el Frontend Institucional (`frontend-v2`)

> **Auditor:** *"¿Cuándo migrará de index.html a arquitectura React/Next modular? ¿Cómo manejarán tx lifecycle, optimistic UI, etc.?"*

**Respuesta:**
Ya hemos migrado. El proyecto en `frontend-v2/` es una aplicación **Next.js 16 (App Router)** completamente modular:
- **Estado Global y Reactividad:** Utilizamos **Wagmi** y **TanStack Query (React Query)**, lo que soluciona inmediatamente el problema del polling manual de 15 segundos mediante *cache strategies*, deduplicación de peticiones y protección contra datos obsoletos (stale data).
- **WalletConnect:** Utilizamos **AppKit de Reown (WalletConnect v2)** en producción. No hay *stubs*. Soporta inyección móvil nativa y EIP-6963 de forma *out-of-the-box*.
- **Manejo de Errores y UX:** Eliminamos todos los `alert()`. Utilizamos componentes de UI modernos (Toasts) para mostrar simulaciones fallidas, estados de carga y confirmaciones asíncronas bloqueantes (`await tx.wait()` se maneja con indicadores de progreso visuales).

---

## 2. Preguntas Avanzadas sobre Chainlink VRF

> **Auditor:** *"¿Qué ocurre si VRF responde tarde, pero la ronda siguiente ya comenzó? ¿Existe entropy replay protection, stale fulfillment protection, duplicate callback handling?"*

**Respuesta:**

El contrato `NexumManager` implementa el estándar oficial de Chainlink `VRFConsumerBaseV2`. La seguridad y protección contra ataques en la selección aleatoria es manejada rigurosamente:

1. **Replay Protection y Duplicate Callbacks:**
   La función `fulfillRandomWords` interna requiere que el `requestId` coincida exactamente con el guardado en `round.vrfRequestId`. 
   ```solidity
   require(round.vrfRequestId == requestId, "Invalid VRF req");
   ```
   Una vez que el callback se ejecuta, el estado de la ronda se marca como `completed = true`. Cualquier intento de re-entrar o duplicar el callback revertirá automáticamente porque la ronda ya no estará activa para esa liquidación. El propio coordinador de Chainlink garantiza *nonce-based replay protection*.

2. **Respuestas Tardías (Stale Fulfillment):**
   Si el VRF se retrasa, **no afecta la integridad de la ronda siguiente**. La estructura de datos almacena el estado de forma bidimensional (por Producto y por ID de Ronda):
   `rounds[productId][roundId]`.
   El evento de finalización (`finalizeRound`) y la apertura de una nueva ronda incrementan `currentRound[productId]`. Si el VRF responde 3 horas tarde, procesará la data de `rounds[productId][oldRoundId]`, dejando intacta la ronda actual (que es `currentRound`). La distribución es retroactiva y segregada.

3. **Garantías de Entropía:**
   Chainlink VRF utiliza firmas criptográficas verificables on-chain (ECVRF). Es matemáticamente imposible que los nodos mineros o el propio coordinador manipulen la entropía devuelta.

---

## 3. Resiliencia del Frontend (Observabilidad)

> **Auditor:** *"¿Existe offline mode, fallback RPC quorum, provider divergence detection?"*

**Respuesta:**
- **RPC Fallback:** En `frontend-v2`, Viem/Wagmi está configurado para soportar múltiples `transports` en cascada (Fallback RPCs). Si el nodo primario falla, cambia automáticamente al secundario sin impactar la UI.
- **Multicall Batching:** Las lecturas masivas del contrato se realizan mediante `multicall3`, agrupando las peticiones para no saturar los RPCs y evitar errores de *rate limit*.

### Conclusión
Entendemos sus alertas al ver el código del prototipo en Vanilla JS (`frontend/`). Les pedimos encarecidamente evaluar el código de `frontend-v2/` donde toda esta arquitectura de grado institucional ya está implementada y lista para Mainnet.
