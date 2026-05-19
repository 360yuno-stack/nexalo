/**
 * NEXALO — FAQ + Chat Bot Institucional
 * Base de conocimiento completa para clientes e inversores.
 * Respuestas basadas en la lógica real de los smart contracts.
 */

const FAQ_DATA = [
  // ── GENERAL ──
  { q: "¿Qué es NEXALO?", a: "NEXALO es un protocolo DeFi autónomo de lotería descentralizada en BNB Chain (BSC). Todo el sistema opera mediante smart contracts inmutables: nadie puede modificar las reglas, pausar premios ni acceder a los fondos. El protocolo distribuye el 96% del capital directamente a participantes, inversores y holders de NXL.", cat: "general" },
  { q: "¿En qué red blockchain opera?", a: "NEXALO opera en BNB Chain (Binance Smart Chain). Actualmente en fase Testnet (usa tBNB del faucet oficial). El deployment a Mainnet se realizará mediante un Gnosis Safe multisig, seguido de la renuncia irreversible al ownership (finalizeAutonomy) que hace al protocolo completamente autónomo.", cat: "general" },
  { q: "¿NEXALO es seguro?", a: "Sí. El protocolo implementa múltiples capas de seguridad: ReentrancyGuard en todas las funciones que mueven fondos, patrón CEI (Checks-Effects-Interactions) estricto, protección anti-flash-loan con snapshots en el Treasury, pauseGuardian de emergencia, y la función finalizeAutonomy() que renuncia al ownership de forma irreversible. Todos los contratos usan librerías OpenZeppelin auditadas.", cat: "general" },
  { q: "¿Quién es el dueño, fundador o CEO de NEXALO?", a: "NEXALO no tiene un CEO o dueño centralizado, es un protocolo DeFi gobernado por Smart Contracts. El 'equipo fundador' solo recibe el 3% del supply de NXL (bloqueado por 2 años) y los partners el 1% (bloqueado por 1 año). El 96% restante va a la comunidad. Los fondos están custodiados matemáticamente por el contrato, sin cuentas bancarias. Y tras ejecutar finalizeAutonomy(), ni siquiera el creador puede modificar las reglas.", cat: "general" },
  { q: "¿Cómo compro y cobro si no sé de cripto y uso tarjeta bancaria?", a: "NEXALO es muy fácil y seguro para usuarios no-cripto. 1) Para comprar con tarjeta de crédito/débito usamos pasarelas globales auditadas (como Transak o MoonPay). NEXALO jamás ve ni guarda los datos de tu tarjeta, por lo que es IMPOSIBLE que la clonen (encriptación bancaria). 2) Pagas comisiones casi nulas porque usamos la red BSC (Binance Smart Chain). 3) Si ganas un premio o cobras referidos, recibes USDT (dólares digitales). Puedes enviarlos directo a un exchange como Binance para convertirlos a tu moneda local y retirarlos a tu cuenta bancaria tradicional en minutos. Tú tienes el control total.", cat: "general" },

  // ── COMPRA DE TICKETS ──
  { q: "¿Cómo compro tickets?", a: "1) Conecta tu wallet (MetaMask o WalletConnect). 2) Asegúrate de tener USDT en BSC. 3) Elige un Nexum (FLASH, ORIGINAL, PREMIUM, ELITE, VIP o BLACKBLOK). 4) Usa los botones de compra rápida (1, 3, 5 o 10 tickets) o selecciona números manualmente. El contrato aprueba automáticamente el gasto de USDT y asigna tus tickets.", cat: "compra" },
  { q: "¿Puedo elegir mis propios números?", a: "Sí. Con el botón 'Elegir Números Manualmente' puedes seleccionar los números exactos que deseas. También puedes usar la compra rápida donde el contrato asigna números aleatorios disponibles usando el algoritmo Fisher-Yates on-chain, garantizando distribución justa sin duplicados.", cat: "compra" },
  { q: "¿Qué pasa si un número ya está tomado?", a: "El contrato verifica automáticamente la disponibilidad. En compra manual, solo puedes seleccionar números disponibles (los ocupados aparecen deshabilitados). En compra rápida, el algoritmo Fisher-Yates on-chain solo asigna números que están libres.", cat: "compra" },
  { q: "¿Cuánto cuesta un ticket?", a: "Depende del Nexum:\n• FLASH: $1 USDT (3 dígitos, 000-999)\n• ORIGINAL: $1 USDT (4 dígitos, 0000-9999)\n• PREMIUM: $20 USDT (3 dígitos)\n• ELITE: $10 USDT (4 dígitos)\n• VIP: $200 USDT (3 dígitos)\n• BLACKBLOK: $200 USDT (4 dígitos)\nTodos los precios son fijos y están definidos en el smart contract.", cat: "compra" },
  { q: "¿Cuánto gas consume comprar tickets?", a: "Una compra de 10 tickets FLASH consume aproximadamente 900K–1.2M de gas en BSC, lo que equivale a ~$0.20–$0.50 USD con gas price estándar. El contrato está optimizado con lazy Fisher-Yates (O(1) por ticket) para minimizar costos de gas.", cat: "compra" },

  // ── PREMIOS Y SORTEOS ──
  { q: "¿Cómo se decide el ganador?", a: "El ganador se selecciona mediante Chainlink VRF (Verifiable Random Function), un oráculo de aleatoriedad criptográficamente verificable. Nadie —ni el equipo, ni validadores, ni mineros— puede predecir o manipular el resultado. La prueba VRF queda registrada on-chain y es auditable por cualquier persona.", cat: "premios" },
  { q: "¿Cuándo se cierra una ronda?", a: "Una ronda se cierra automáticamente cuando se venden todos los tickets del Nexum correspondiente (maxTickets). En ese momento, el contrato solicita aleatoriedad a Chainlink VRF para seleccionar al ganador. No hay intervención humana en el proceso.", cat: "premios" },
  { q: "¿Cómo reclamo mi premio?", a: "Después de que el sorteo finaliza: ve a 'Mi Cuenta' → haz clic en 'Reclamar USDT'. Tu premio aparecerá como saldo reclamable y se transferirá directamente a tu wallet en una sola transacción. También puedes reclamar tokens NXL ganados por participación.", cat: "premios" },
  { q: "¿Qué pasa si Chainlink VRF falla?", a: "Si el VRF no responde en 7 días, cualquier usuario puede llamar la función resolveStuckRound que reenvía la solicitud de aleatoriedad. Esto evita que los fondos queden bloqueados. Es un mecanismo de seguridad anti-estancamiento integrado en el contrato.", cat: "premios" },
  { q: "¿Qué pasa si no se venden todos los tickets de una ronda?", a: "Las rondas en NEXALO no tienen límite de tiempo, se basan estrictamente en volumen (maxTickets). Si una ronda es lenta y no se venden todos los tickets, simplemente permanecerá abierta hasta que se llene. El contrato está diseñado matemáticamente para garantizar que el premio completo (Jackpot) esté financiado al 100% antes de solicitar el ganador a Chainlink VRF.", cat: "premios" },

  // ── TOKEN NXL ──
  { q: "¿Qué es el token NXL?", a: "NXL es el token de gobernanza y utilidad de NEXALO (BEP-20 en BSC). Supply total: 100,000,000 NXL. De estos, 96M están reservados para distribución a participantes como recompensa por compra de tickets. El precio lo determina exclusivamente el mercado libre; el protocolo no fija ni garantiza ningún precio.", cat: "token" },
  { q: "¿Cómo gano tokens NXL?", a: "Cada vez que compras un ticket recibes NXL automáticamente. La cantidad varía por Nexum: FLASH = 0.1 NXL, ORIGINAL = 0.25, PREMIUM = 0.5, ELITE = 0.55, VIP = 0.85, BLACKBLOK = 1 NXL por ticket. Además, el ganador recibe un bonus adicional en NXL.", cat: "token" },
  { q: "¿Dónde puedo ver el precio de NXL?", a: "El precio de NXL lo fija el mercado libre. Puedes verificarlo en DEXs como PancakeSwap una vez que el protocolo esté en Mainnet. NEXALO no establece, manipula ni garantiza ningún precio para el token NXL.", cat: "token" },
  { q: "¿Para qué sirve tener NXL?", a: "NXL tiene múltiples utilidades: 1) Staking para recibir dividendos en WBTC del TreasuryBTC. 2) Bonus en premios para holders. 3) Participación en futuras decisiones de gobernanza del protocolo. 4) Redención proporcional del Treasury cuando se abra la ventana de canje.", cat: "token" },

  // ── INVERSORES ──
  { q: "¿Cómo funciona la inversión en NEXALO?", a: "Como inversor, puedes aportar liquidez USDT a las pools de cualquier Nexum. Cuando la ronda finaliza, el smart contract te devuelve tu capital principal más un porcentaje de ganancias del Liquidity Profit Pool, directamente a tu wallet. Todo el proceso es on-chain y transparente.", cat: "inversor" },
  { q: "¿Cuál es el ROI estimado para inversores?", a: "El ROI varía según el Nexum y la tasa de llenado de la ronda. El modelo de distribución asigna un porcentaje del pool a inversores de liquidez. Puedes simular retornos en la Calculadora ROI de la sección Inversores. Los retornos reales dependen de la actividad del protocolo.", cat: "inversor" },
  { q: "¿Mi capital como inversor está en riesgo?", a: "El contrato está diseñado para devolver el capital principal al cierre de la ronda más las ganancias. Sin embargo, como en todo protocolo DeFi, existen riesgos inherentes de smart contract. El protocolo mitiga esto con auditorías, ReentrancyGuard, y código inmutable tras finalizeAutonomy.", cat: "inversor" },
  { q: "¿Qué es la Calculadora ROI?", a: "Es una herramienta en la sección Inversores que te permite simular retornos potenciales basándote en: monto de inversión, producto Nexum seleccionado y número de rondas. Los cálculos se basan en el modelo de distribución del protocolo.", cat: "inversor" },

  // ── REFERIDOS Y EMBAJADORES ──
  { q: "¿Cómo funcionan las comisiones de referido?", a: "Comparte tu link único de referido. Cuando alguien compra tickets usando tu link: Nivel 1 (referido directo) = 5% de comisión, Nivel 2 = 3%, Nivel 3 = 2%. Las comisiones se acreditan automáticamente en USDT con cada compra, sin límite de referidos.", cat: "referidos" },
  { q: "¿Qué es el Programa de Embajadores?", a: "Los Embajadores son usuarios verificados que reciben una parte del pool de comisiones del protocolo (5% del capital). Para participar, regístrate en la sección 'Embajadores'. Una vez aprobado, recibes comisiones automáticas por la actividad global del protocolo.", cat: "referidos" },
  { q: "¿Cómo me registro como Embajador?", a: "Ve a la sección 'Embajadores' y haz clic en 'Registrarse'. Necesitas tu wallet conectada. El registro se procesa on-chain mediante el contrato AmbassadorRegistry. Una vez aprobado, empezarás a recibir tu porcentaje del pool de embajadores automáticamente.", cat: "referidos" },

  // ── TREASURY Y STAKING ──
  { q: "¿Qué es el Treasury BTC?", a: "El TreasuryBTC recibe el 10% de cada compra de tickets y acumula fondos en USDT/WBTC para la DAO. Los holders de NXL que tengan tokens antes de la apertura de la ventana de redención pueden canjearlos proporcionalmente. El treasury usa snapshots anti-flash-loan para evitar manipulación.", cat: "treasury" },
  { q: "¿Qué es el Staking NXL?", a: "El staking te permite bloquear tus tokens NXL para recibir dividendos en WBTC (Bitcoin wrapped) provenientes del TreasuryBTC. No tiene lock period — puedes retirar en cualquier momento. Los dividendos se acumulan por ronda y dependen de la cantidad total en stake.", cat: "treasury" },
  { q: "¿Qué es la Tesorería DeFi?", a: "La Tesorería gestiona el capital del protocolo mediante dos estrategias DeFi: Aave v3 (40% del TVL, ~4.2% APY, supply USDT/USDC) y AIYield Optimizer (60% del TVL, ~11.3% APY, multi-pool LP en BSC). Todo es autónomo y gestionado por smart contracts.", cat: "treasury" },

  // ── DISTRIBUCIÓN ──
  { q: "¿Cómo se distribuye el dinero de cada venta?", a: "De cada compra de ticket, el smart contract distribuye automáticamente:\n• Premio principal (jackpot): mayoría del pool\n• Recompensa instantánea: porcentaje al comprador\n• Comisiones de referido: 5% + 3% + 2% (3 niveles)\n• Treasury BTC: 10% para la DAO/holders\n• Pool de Embajadores: 5% dividido entre embajadores\n• Inversores de liquidez: retorno sobre su aporte\nTodo se ejecuta on-chain sin intermediarios.", cat: "distribucion" },
  { q: "¿Qué significa '96% Rewards'?", a: "Significa que el 96% del capital total que entra al protocolo se redistribuye directamente a los participantes del ecosistema: ganadores, compradores (recompensas instantáneas + NXL), referidos, embajadores, inversores y holders de NXL. Solo el 4% se destina a operaciones del protocolo.", cat: "distribucion" },

  // ── WALLET Y TÉCNICO ──
  { q: "¿Qué wallet necesito?", a: "Puedes usar MetaMask (extensión de navegador o app móvil) o cualquier wallet compatible con WalletConnect (Trust Wallet, SafePal, etc). Tu wallet debe estar configurada en BNB Chain (BSC). En Testnet necesitas tBNB del faucet oficial de Binance.", cat: "tecnico" },
  { q: "¿Cómo conecto mi wallet?", a: "Haz clic en 'Conectar' en la esquina superior derecha. Selecciona MetaMask o WalletConnect. Aprueba la conexión en tu wallet. Si estás en la red incorrecta, el protocolo te pedirá cambiar a BSC automáticamente.", cat: "tecnico" },
  { q: "¿Qué son los contratos inmutables?", a: "Los contratos de NEXALO no tienen funciones de upgrade ni proxy. Una vez desplegados, el código no puede ser modificado por nadie. Tras ejecutar finalizeAutonomy(), el owner se establece en address(0), haciendo imposible cualquier cambio. Esto garantiza que las reglas del juego nunca cambiarán.", cat: "tecnico" },
  { q: "¿Puedo verificar el código?", a: "Sí. Todos los contratos están verificados en BscScan. Puedes leer el código fuente, verificar las funciones y auditar cada transacción. La transparencia total es un principio fundamental de NEXALO.", cat: "tecnico" },
  { q: "¿Qué ocurre cuando se distribuyan los 100 millones de NXL?", a: "Cuando el supply máximo de 100,000,000 NXL se distribuya por completo, el smart contract emitirá el evento 'NXLRewardsExhausted'. Desde ese momento, la compra de tickets dejará de otorgar NXL como recompensa extra. Sin embargo, el protocolo es inmutable y seguirá funcionando de manera autónoma para siempre, distribuyendo exclusivamente los premios (Jackpots) y comisiones en USDT.", cat: "token" },
  { q: "¿Qué recibo si devuelvo (quemo) mis tokens y cuánto tiempo dura esa ventana?", a: "El contrato TreasuryBTC abre una 'Ventana de Redención' exactamente 1 vez al año, la cual dura 7 días. Durante esa ventana, puedes devolver (quemar) tus tokens NXL al contrato y recibirás a cambio USDT provenientes de la tesorería DeFi, no WBTC. El contrato calcula el USDT que recibes tomando un 'snapshot' de todo el dinero en el tesoro dividido entre los NXL circulantes. (Nota: los dividendos regulares que recibes por holdear NXL sí se pagan en WBTC, pero al quemar tu NXL en la ventana recibes el valor subyacente en USDT). Además, puedes venderlos en PancakeSwap en cualquier momento.", cat: "token" },
  
  // ── MECÁNICAS DE CONTRATOS (SMART CONTRACTS DEEP DIVE) ──
  { q: "¿Qué pasa si Chainlink VRF falla o se queda atascado?", a: "El contrato NexumManager cuenta con la función 'resolveStuckRound'. Si el oráculo de Chainlink VRF no responde tras solicitar la aleatoriedad, y pasan más de 7 días, cualquier persona puede llamar a esta función para forzar una nueva petición de números aleatorios. Esto garantiza que los fondos de una ronda nunca queden bloqueados.", cat: "tecnico" },
  { q: "¿Qué es finalizeAutonomy, quién la ejecuta y qué hace?", a: "SOLO el equipo fundador (el 'owner' del contrato) puede ejecutarla, y se hace una sola vez. Al ejecutarla, el rol de 'owner' se destruye para siempre (pasa a ser la address 0) y el protocolo entra en Inmutabilidad Absoluta. A partir de ahí, nadie (ni el equipo ni ninguna persona) podrá modificar reglas, cambiar estrategias ni tocar los fondos. Es el paso final y definitivo hacia la descentralización total.", cat: "tecnico" },
  { q: "¿Cómo funciona el Supply y el Vesting del token NXL?", a: "El contrato NXLToken dictamina un supply de 100M NXL exactos (es imposible mintear más). Se distribuyen así: 96M están reservados para ser ganados por los usuarios al comprar tickets. 3M son para el fundador, bloqueados en un vesting lineal de 2 años (730 días). 1M es para socios, bloqueado por 1 año (365 días).", cat: "token" },
  { q: "¿Cómo evitan los Flash Loans en la Tesorería y Staking?", a: "El contrato usa un sistema de 'Checkpoints' (snapshots) basados en el número de bloque (usando uint48 para evitar desbordamientos). Al abrir la ventana de quema de NXL o al calcular los dividendos de Staking, se toma una 'foto' de tu balance en ese bloque exacto. Esto hace matemáticamente imposible que un atacante use un Flash Loan para depositar mucho dinero en un solo bloque y robar recompensas.", cat: "tecnico" },
  { q: "¿En qué consisten las Estrategias Aave y Venus de la Tesorería?", a: "El contrato TreasuryBTC no deja el capital inactivo. Lo deposita automáticamente en protocolos de lending DeFi como Aave v3 y Venus Protocol en la BNB Chain. Estos protocolos generan un APY dinámico que hace crecer la tesorería continuamente. Una función de 'harvest' recolecta las ganancias, lo que incrementa la cantidad de USDT que respalda al token NXL.", cat: "treasury" },
  { q: "¿Qué diferencia hay entre Aave y tener mis NXL y WBTC?", a: "Aave y Venus son herramientas internas del contrato: el protocolo las usa de fondo para multiplicar los fondos de la Tesorería en USDT. Como usuario, no necesitas usar Aave ni entenderlo. Tu única acción es holdear NXL y hacer Staking. Al hacerlo, ganas dividendos pasivos en WBTC. Mientras tanto, Aave hace crecer el USDT que respalda tu NXL, haciendo que valga más cuando decidas quemarlo en la ventana anual. En resumen: Aave trabaja en secreto para el protocolo, mientras que tú solo disfrutas de tus NXL y WBTC.", cat: "treasury" },
  { q: "¿Cómo se calculan y entregan los dividendos de Staking?", a: "Al hacer Staking en NexaloStaking, recibes WBTC de manera pro-rata. El TreasuryBTC inyecta dividendos periódicamente. Si al momento de inyectar fondos NO hay usuarios haciendo staking, el contrato no revierte ni bloquea el dinero: lo guarda en un 'buffer'. El primer usuario que haga staking activará la distribución matemática de ese buffer acumulado. Usa patrón 'pull-payments'.", cat: "treasury" },
  { q: "¿Cómo funciona la protección de referidos en bucle (circular)?", a: "ReferralNetwork organiza los referidos en un árbol de 3 niveles (5%, 3%, 2%). Para evitar manipulación, el contrato tiene un loop anti-circular: al registrar tu billetera, recorre hacia arriba 3 niveles verificando que el nuevo usuario no sea ya un 'ancestro' de quien lo invitó. Esto previene loops infinitos de pagos.", cat: "referidos" },
  { q: "¿Qué ventajas técnicas tiene el AmbassadorRegistry?", a: "Para ser embajador, el contrato exige que tu billetera sea pre-aprobada por el owner. Una vez dentro, recibes una porción del 5% global de comisiones. El contrato usa un algoritmo de 'crystallized rewards': si un embajador es desactivado, las ganancias generadas hasta ese bloque exacto se guardan de forma segura (storedRewards) y no las pierde. También usa Pull-Payments por seguridad.", cat: "referidos" },
  { q: "¿Qué pasa si los NXL no alcanzan para una ronda completa o se terminan del todo?", a: "Si estás comprando tickets a mitad de una ronda y los NXL se agotan, tu compra en USDT es válida para el jackpot pero no recibes el bonus NXL. Además, si el NXL no alcanza para iniciar una ronda nueva, el contrato desactiva ese Nexum. Cuando TODOS los Nexums quedan inactivos, el protocolo ejecuta la función para QUEMAR ('burnUndistributed') cualquier remanente o polvo de NXL que quede en el contrato. También, al abrirse la ventana de redención, los tokens devueltos se queman. Toda esta lógica es altamente deflacionaria y está diseñada matemáticamente para motivar a los holders incrementando el valor de cada token restante.", cat: "tecnico" },
  { q: "¿Cuál sería el precio de los NXL al final de distribuirse los 100M si nadie vende?", a: "Dado que el supply máximo está hard-capped en 100M, si se distribuye el 100% de los tokens y nadie vende, la oferta en el mercado sería cero (escasez absoluta). Matemáticamente, como la Tesorería sigue generando USDT constantemente (gracias a Aave y Venus), el 'precio piso' (floor price) intrínseco de cada NXL subiría a su nivel máximo. En un DEX, una oferta cero combinada con la deflación del protocolo dispararía el precio al alza de forma exponencial. Esta es la fuerza fundamental de la tokenomics deflacionaria de NEXALO.", cat: "token" },
  { q: "¿Cuántos dólares pierdo por cobrar un premio o retiro?", a: "Cero dólares. En NEXALO, reclamar tu premio o comisiones es una transacción directa de Smart Contract. Solo pagas el 'gas' de la red BSC, que son unos pocos centavos (aprox $0.05 a $0.15 USD). No hay comisiones ocultas, ni penalizaciones, ni retenciones corporativas. ¡El 100% de tu premio va directo a tu wallet!", cat: "premios" },
  { q: "¿Qué pasa si no reclamo mi premio? ¿Hay un tiempo límite?", a: "No hay ningún tiempo límite para reclamar tu premio. Tu saldo permanece almacenado de forma segura e indefinida en el smart contract. Puedes reclamarlo hoy, mañana, en un mes o en 10 años. El contrato NO tiene función de expiración ni mecanismo para que alguien retire tus fondos.\n\n¿Olvidaste reclamar? Simplemente:\n1) Conecta la misma wallet con la que compraste los tickets.\n2) Ve a la sección 'Mi Cuenta'.\n3) Verás tu saldo pendiente en 'USDT Reclamable'.\n4) Haz clic en 'Reclamar USDT' y confirma la transacción.\n\nSolo TÚ (con tu wallet) puedes ejecutar claimStable(). Es matemáticamente imposible que tu premio desaparezca o sea reasignado.", cat: "premios" }
];

// ── CHAT KEYWORDS ──
const CHAT_KB = [];
FAQ_DATA.forEach((item, i) => {
  const words = item.q.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[¿?¡!]/g,"")
    .split(/\s+/)
    .filter(w => w.length > 3);
  CHAT_KB.push({ keys: words, ans: item.a, idx: i });
});
// Additional keyword mappings for common questions
const getIdx = (str) => {
  const idx = FAQ_DATA.findIndex(i => i.q.includes(str));
  return idx !== -1 ? idx : 0;
};

const EXTRA_KB = [
  { keys: ["comprar","ticket","numero","numeros","buy","boleto"], ref: getIdx("Cómo compro tickets") },
  { keys: ["precio","cuesta","costar","pagar","cuanto"], ref: getIdx("Cuánto cuesta") },
  { keys: ["ganador","vrf","aleatorio","chainlink","justo","random","suerte"], ref: getIdx("decide el ganador") },
  { keys: ["premio","reclamar","claim","cobrar","ganar","gane"], ref: getIdx("reclamo mi premio") },
  { keys: ["referido","comision","comisiones","link","invitar","amigo"], ref: getIdx("comisiones de referido") },
  { keys: ["embajador","ambassador","programa"], ref: getIdx("Programa de Embajadores") },
  { keys: ["treasury","btc","dao","redimir","tesoro","tesoreria"], ref: getIdx("Estrategias Aave") },
  { keys: ["staking","stake","wbtc","bloquear","dividendo"], ref: getIdx("Staking") },
  { keys: ["seguro","auditoria","hack","seguridad","robar","robo","estafa","scam","ual"], ref: getIdx("NEXALO es seguro") },
  { keys: ["gas","costo","barato","gwei","comision gas"], ref: getIdx("gas consume") },
  { keys: ["blackblok","mega","millon","1m","grande"], ref: getIdx("premios por Nexum") },
  { keys: ["bsc","binance","blockchain","red","mainnet","testnet","cadena"], ref: getIdx("red blockchain") },
  { keys: ["nexalo","protocolo","plataforma","sistema"], ref: getIdx("Qué es NEXALO") },
  { keys: ["elegir","escoger","manual","especifico","seleccionar"], ref: getIdx("propios números") },
  { keys: ["nxl","token","moneda","cripto","criptomoneda"], ref: getIdx("token NXL") },
  { keys: ["invertir","inversion","inversor","liquidez","pool","rendimiento","roi","retorno"], ref: getIdx("inversión en NEXALO") },
  { keys: ["wallet","metamask","walletconnect","conectar","billetera"], ref: getIdx("conecto mi wallet") },
  { keys: ["distribucion","reparto","porcentaje","destino","fondos", "contabilidad", "perdido", "faltan", "usdt", "reciben", "calculo", "matematica", "cuadra"], ref: getIdx("96%") },
  { keys: ["inmutable","autonomo","ownership","owner","control","fondos", "dueño", "creador", "creo", "ceo", "equipo", "parner"], ref: getIdx("dueño, fundador o CEO") },
  { keys: ["ronda","cierra","cerrar","cuando","termina","completa"], ref: getIdx("cierra una ronda") },
  { keys: ["flash","original","premium","elite","vip","producto","nexum"], ref: getIdx("premios por Nexum") },
  { keys: ["verificar","codigo","bscscan","transparente","auditar"], ref: getIdx("verificar el código") },
  { keys: ["riesgo","perder","capital","perdida","peligro"], ref: getIdx("capital como inversor") },
  { keys: ["registrar","registro","embajador","aplicar"], ref: getIdx("registro como Embajador") },
  { keys: ["utilidad","servir","beneficio","ventaja","holder"], ref: getIdx("Para qué sirve") },
  { keys: ["100m", "terminar", "distribuirse", "limite", "maximo", "agote", "agotan", "exhaust"], ref: getIdx("distribuyan los 100 millones") },
  { keys: ["vender", "venta", "devuelvo", "devolver", "ventana", "dura", "duracion", "quemar", "burn", "quema", "queman", "canjear", "canje", "cambiar", "mercado"], ref: getIdx("devuelvo (quemo)") },
  { keys: ["vrf", "chainlink", "falla", "atasca", "atascado", "stuck", "resolvestuckround", "oraculo", "responde"], ref: getIdx("Chainlink VRF falla") },
  { keys: ["finalizeautonomy", "inmutable", "inmutabilidad", "descentralizacion", "descentralizado", "ejecutar", "puede", "cualquier", "cualkquier", "persona", "ejecuta"], ref: getIdx("finalizeAutonomy") },
  { keys: ["supply", "vesting", "founder", "fundador", "partner", "socio", "mintear"], ref: getIdx("Supply y el Vesting") },
  { keys: ["flash", "loan", "prestamo", "manipular", "manipulacion", "snapshot", "checkpoint"], ref: getIdx("evitan los Flash Loans") },
  { keys: ["aave", "venus", "estrategia", "strategy", "yield", "apy", "harvest"], ref: getIdx("Aave y Venus") },
  { keys: ["diferencia", "entre", "aave", "quedarme", "tener", "nxl", "wbtc", "entiendo", "relacion", "confuso"], ref: getIdx("diferencia hay entre Aave") },
  { keys: ["dividendo", "dividendos", "buffer", "pro-rata", "prorrata"], ref: getIdx("calculan y entregan") },
  { keys: ["bucle", "circular", "loop", "infinito", "arbol", "ancestro"], ref: getIdx("protección de referidos") },
  { keys: ["crystallized", "desactiva", "inactivo", "cristalizado", "bloque"], ref: getIdx("AmbassadorRegistry") },
  { keys: ["alcanza", "alcanzan", "mitad", "completa"], ref: getIdx("NXL no alcanzan") },
  { keys: ["precio", "nadie", "vende", "cero", "escasez", "exponencial"], ref: getIdx("precio de los NXL") },
  { keys: ["venden", "lent", "lenta", "lento", "esperar", "tiempo", "llene", "llenar"], ref: getIdx("no se venden todos") },
  { keys: ["tarjeta", "clonan", "clonar", "fiat", "banco", "bancaria", "primera", "robo", "robarian", "cripto", "crypto", "usuario", "nuevo", "experiencia", "tradicional", "pasarela", "visa", "mastercard"], ref: getIdx("compro y cobro si no sé") },
  { keys: ["cuanto", "cuantos", "dolar", "dolares", "pierdo", "cobrar", "reclamar", "premio", "comision", "oculta", "retiro"], ref: getIdx("Cuántos dólares pierdo") },
  { keys: ["reclamo", "reclamar", "expira", "caduca", "limite", "tiempo", "vence", "pierde", "premio", "olvidé", "olvide", "olvido", "olvida", "olvidaron", "pendiente", "recuperar"], ref: getIdx("no reclamo mi premio") }
];
EXTRA_KB.forEach(e => CHAT_KB.push({ keys: e.keys, ans: FAQ_DATA[e.ref]?.a || "", idx: e.ref }));

const QUICK_QUESTIONS = [
  "¿Cómo compro tickets?",
  "¿Qué es NXL?",
  "¿Cómo gano referidos?",
  "¿Es seguro?",
  "¿Cómo invierto?",
  "¿Qué es BLACKBLOK?",
  "¿Cómo reclamo mi premio?",
];

function _faqFind(text) {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿?¡!.,]/g,"");
  const words = t.split(/\s+/).filter(w => w.length > 0);
  
  let best = null, bestScore = 0;
  for (const entry of CHAT_KB) {
    let score = 0;
    for (const k of entry.keys) {
      // Direct word match gets high score, substring match gets lower score
      if (words.includes(k)) score += 3;
      else if (words.some(w => w.includes(k) && k.length >= 4)) score += 1;
    }
    // Boost score if 'nxl' is matched specifically, but ONLY for short queries to prevent overriding specific questions
    if (entry.keys.includes('nxl') && words.includes('nxl') && words.length <= 3) score += 2;
    
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return best && bestScore >= 2 ? best.ans : null;
}

function _faqBotReply(text) {
  const ans = _faqFind(text);
  if (ans) return ans;
  return "No encontré una respuesta exacta. Puedes preguntarme sobre:\n\n• Comprar tickets y elegir números\n• Premios y sorteos (Chainlink VRF)\n• Token NXL y staking\n• Inversión y pools de liquidez\n• Referidos y embajadores\n• Seguridad del protocolo\n• Wallets compatibles\n\nTambién puedes explorar las preguntas frecuentes arriba. 👆";
}

function _appendMessage(role, text) {
  const box = document.getElementById("chat-messages");
  if (!box) return;
  const isBot = role === "bot";
  const wrapper = document.createElement("div");
  wrapper.className = "flex gap-3" + (isBot ? "" : " justify-end");

  if (isBot) {
    wrapper.innerHTML = `
      <div class="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" fill="none" stroke="#3B82F6" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
      </div>
      <div class="bg-blue-500/8 border border-blue-500/15 rounded-2xl rounded-tl-none px-4 py-3 max-w-[82%]">
        <p class="text-slate-300 text-sm leading-relaxed">${text.replace(/\n/g,"<br>")}</p>
        <p class="text-blue-400/40 text-xs mt-1">NEXALO Bot</p>
      </div>`;
  } else {
    wrapper.innerHTML = `
      <div class="bg-white/5 border border-white/10 rounded-2xl rounded-tr-none px-4 py-3 max-w-[82%]">
        <p class="text-slate-200 text-sm">${text}</p>
        <p class="text-slate-600 text-xs mt-1">Tú</p>
      </div>
      <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-sm">👤</div>`;
  }
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
}

function _showTyping() {
  const box = document.getElementById("chat-messages");
  if (!box) return;
  const el = document.createElement("div");
  el.id = "typing-indicator";
  el.className = "flex gap-3 items-center";
  el.innerHTML = `
    <div class="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" fill="none" stroke="#3B82F6" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
    </div>
    <div class="bg-blue-500/8 border border-blue-500/15 rounded-2xl rounded-tl-none px-4 py-3">
      <span class="inline-flex gap-1">
        <span class="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" style="animation-delay:0ms"></span>
        <span class="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" style="animation-delay:150ms"></span>
        <span class="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" style="animation-delay:300ms"></span>
      </span>
    </div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function _removeTyping() {
  document.getElementById("typing-indicator")?.remove();
}

function sendChatMessage(overrideText) {
  const input = document.getElementById("chat-input");
  const text = (overrideText || (input && input.value.trim()));
  if (!text) return;
  if (input) input.value = "";
  _appendMessage("user", text);
  _showTyping();
  setTimeout(() => {
    _removeTyping();
    _appendMessage("bot", _faqBotReply(text));
  }, 600 + Math.random() * 400);
}

function _buildFAQ() {
  const container = document.getElementById("faq-list");
  if (!container) return;
  container.innerHTML = "";

  const categories = {
    general: "General",
    compra: "Compra de Tickets",
    premios: "Premios y Sorteos",
    token: "Token NXL",
    inversor: "Inversores",
    referidos: "Referidos y Embajadores",
    treasury: "Treasury y Staking",
    distribucion: "Distribución",
    tecnico: "Wallet y Técnico"
  };

  let currentCat = "";
  // ONLY render the first 5 questions in the visual accordion
  FAQ_DATA.slice(0, 5).forEach((item, i) => {
    if (item.cat !== currentCat) {
      currentCat = item.cat;
      const catHeader = document.createElement("div");
      catHeader.className = "mt-6 mb-2 first:mt-0";
      catHeader.innerHTML = `<p class="text-xs text-blue-400 uppercase tracking-widest font-semibold">${categories[currentCat] || currentCat}</p>`;
      container.appendChild(catHeader);
    }

    const el = document.createElement("div");
    el.className = "glass rounded-xl overflow-hidden transition-all hover:border-blue-400/30";
    el.innerHTML = `
      <button
        class="w-full text-left px-6 py-4 flex items-center justify-between gap-4 focus:outline-none group"
        onclick="toggleFAQ(${i})"
        aria-expanded="false"
        id="faq-btn-${i}">
        <span class="font-semibold text-slate-200 group-hover:text-blue-400 transition text-sm">${item.q}</span>
        <span id="faq-icon-${i}" class="text-blue-400 text-xl flex-shrink-0 transition-transform duration-300">+</span>
      </button>
      <div id="faq-body-${i}" class="hidden px-6 pb-5">
        <p class="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">${item.a.replace(/\n/g,"<br>")}</p>
        <button onclick="sendFAQToChat(${i})" class="mt-3 text-xs text-blue-400/70 hover:text-blue-400 transition underline underline-offset-2">Preguntar al chat ↗</button>
      </div>`;
    container.appendChild(el);
  });
}

function toggleFAQ(i) {
  const body = document.getElementById("faq-body-" + i);
  const icon = document.getElementById("faq-icon-" + i);
  const btn  = document.getElementById("faq-btn-" + i);
  if (!body) return;
  const isOpen = !body.classList.contains("hidden");
  FAQ_DATA.forEach((_, j) => {
    document.getElementById("faq-body-" + j)?.classList.add("hidden");
    const ic = document.getElementById("faq-icon-" + j);
    if (ic) { ic.textContent = "+"; ic.style.transform = "rotate(0deg)"; }
    document.getElementById("faq-btn-" + j)?.setAttribute("aria-expanded", "false");
  });
  if (!isOpen) {
    body.classList.remove("hidden");
    icon.textContent = "−";
    icon.style.transform = "rotate(180deg)";
    btn.setAttribute("aria-expanded", "true");
  }
}

function sendFAQToChat(i) {
  document.getElementById("chat-messages")?.scrollIntoView({ behavior: "smooth" });
  sendChatMessage(FAQ_DATA[i].q);
}

function _buildChips() {
  const container = document.getElementById("quick-chips");
  if (!container) return;
  container.innerHTML = "";
  QUICK_QUESTIONS.forEach(q => {
    const btn = document.createElement("button");
    btn.className = "text-xs bg-blue-500/10 border border-blue-500/25 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition";
    btn.textContent = q;
    btn.onclick = () => sendChatMessage(q);
    container.appendChild(btn);
  });
}

(function initFAQ() {
  function tryInit() {
    if (document.getElementById("faq-list")) { _buildFAQ(); _buildChips(); }
    else { setTimeout(tryInit, 200); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tryInit);
  else tryInit();
})();

window.sendChatMessage = sendChatMessage;
window.toggleFAQ = toggleFAQ;
window.sendFAQToChat = sendFAQToChat;
