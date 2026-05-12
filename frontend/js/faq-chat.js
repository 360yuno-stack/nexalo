/**
 * NEXALO — FAQ + Chat Interactivo
 * Acordeón de preguntas frecuentes + bot de respuestas por palabras clave.
 * Sin dependencias externas. Todo local (sin API keys).
 */

const FAQ_DATA = [
  {
    q: "¿Qué es NEXALO?",
    a: "NEXALO es un sistema autónomo de lotería descentralizada sobre BSC (Binance Smart Chain). Los sorteos son 100% transparentes, verificados en blockchain y administrados por contratos inteligentes inmutables. Nadie puede modificar las reglas una vez activado el protocolo."
  },
  {
    q: "¿Cómo compro tickets (números)?",
    a: "Conecta tu wallet MetaMask o WalletConnect, aprueba el gasto en USDT y haz clic en '🎲 Compra rápida' (1, 3, 5 o 10 tickets) o en '🎯 ELEGIR MIS NÚMEROS' para escoger los tuyos. El contrato asigna los números automáticamente usando Fisher-Yates on-chain."
  },
  {
    q: "¿Qué es el token NXL?",
    a: "NXL es el token nativo de NEXALO (ERC-20 en BSC). Se distribuye automáticamente al comprar tickets, con 96M de los 100M tokens reservados para recompensas. Su precio lo determina el mercado libremente; el protocolo no fija ni garantiza ningún precio."
  },
  {
    q: "¿Cómo se decide el ganador? ¿Es justo?",
    a: "El ganador se selecciona mediante Chainlink VRF (Verifiable Random Function): aleatoriedad verificable y prueba criptográfica on-chain. Ningún actor —ni el equipo, ni los validadores— puede manipular el resultado. Si el VRF falla 7 días, 'resolveStuckRound' reintenta la solicitud automáticamente."
  },
  {
    q: "¿Cómo reclamo mi premio?",
    a: "Tras la finalización del sorteo, ve a 'Mi Cuenta' → 'Reclamar Premio'. Tu saldo en USDT aparecerá disponible y se transfiere directamente a tu wallet con un solo clic (función claimStable)."
  },
  {
    q: "¿Cómo funcionan las comisiones de referido?",
    a: "Comparte tu link único. Cuando alguien compra con tu referido: Nivel 1 (tu referido directo) = 5%, Nivel 2 = 3%, Nivel 3 = 2%. Las comisiones se acreditan automáticamente en USDT en cada compra."
  },
  {
    q: "¿Qué es el Programa de Embajadores?",
    a: "Los Embajadores son usuarios aprobados por el protocolo que reciben una parte del 5% del pool de comisiones de embajadores. Regístrate en la sección 'Embajadores' para solicitar tu ingreso al programa."
  },
  {
    q: "¿Qué es el Treasury BTC?",
    a: "El 10% de cada compra va al TreasuryBTC, que acumula fondos en USDT/WBTC para la DAO. Los titulares de NXL con snapshot previo a la apertura de la ventana de redención pueden canjear sus tokens por una parte del treasury."
  },
  {
    q: "¿Qué es el Staking de NXL?",
    a: "En la sección 'Staking' puedes bloquear tus NXL para recibir recompensas en WBTC provenientes del treasury. La tasa depende del tiempo de bloqueo y el total stakeado."
  },
  {
    q: "¿Es seguro? ¿Hay auditoría?",
    a: "El protocolo está en auditoría de seguridad. Cuenta con ReentrancyGuards en todas las funciones que mueven fondos, patrón CEI estricto, protección contra flash loans (snapshot en TreasuryBTC), pauseGuardian de emergencia y finalizeAutonomy() que renuncia al ownership de forma irreversible."
  },
  {
    q: "¿Cuánto gas cuesta comprar tickets?",
    a: "Una compra de 10 tickets FLASH consume ~900K–1.2M de gas en BSC (~$0.20–$0.50 USD con gas price estándar). Optimizamos el contrato para minimizar gas: usamos lazy Fisher-Yates (O(1) por ticket) y empaquetamos datos eficientemente."
  },
  {
    q: "¿Qué es BLACKBLOK?",
    a: "BLACKBLOK es el sorteo MEGA de NEXALO: 10,000 tickets a $200 c/u → Premio de $1,200,000 USD. Es el sorteo más exclusivo del protocolo, con 1 NXL por ticket y el mayor pool de liquidez para inversores."
  },
  {
    q: "¿Qué red blockchain usa NEXALO?",
    a: "NEXALO está desplegado en BSC (Binance Smart Chain). Actualmente en Testnet (tBNB del faucet). El Mainnet deployment será a través de un Gnosis Safe multisig antes de renunciar al ownership."
  },
  {
    q: "¿Puedo elegir mis propios números?",
    a: "Sí. Usa el botón '🎯 ELEGIR MIS NÚMEROS' para seleccionar manualmente tus tickets (función buySpecificTickets). O usa la compra rápida (1/3/5/10) para asignación aleatoria on-chain."
  }
];

// Respuestas del chat por palabras clave
const CHAT_KB = [
  { keys: ["comprar","ticket","número","numeros","buy"],        ans: FAQ_DATA[1].a },
  { keys: ["nxl","token","precio"],                             ans: FAQ_DATA[2].a },
  { keys: ["ganador","vrf","aleatorio","chainlink","justo"],    ans: FAQ_DATA[3].a },
  { keys: ["premio","reclamar","claim","cobrar"],               ans: FAQ_DATA[4].a },
  { keys: ["referido","comision","comisión","link"],            ans: FAQ_DATA[5].a },
  { keys: ["embajador","ambassador"],                           ans: FAQ_DATA[6].a },
  { keys: ["treasury","btc","dao","redimir"],                   ans: FAQ_DATA[7].a },
  { keys: ["staking","stake","wbtc","bloquear"],                ans: FAQ_DATA[8].a },
  { keys: ["seguro","auditoria","auditoría","hack","seguridad"],ans: FAQ_DATA[9].a },
  { keys: ["gas","costo","barato","gwei"],                      ans: FAQ_DATA[10].a },
  { keys: ["blackblok","mega","millón","1m"],                   ans: FAQ_DATA[11].a },
  { keys: ["bsc","binance","blockchain","red","mainnet"],       ans: FAQ_DATA[12].a },
  { keys: ["nexalo","qué es","que es","protocolo"],             ans: FAQ_DATA[0].a },
  { keys: ["elegir","escoger","especific","manual"],            ans: FAQ_DATA[13].a },
];

const QUICK_QUESTIONS = [
  "¿Cómo compro tickets?",
  "¿Qué es NXL?",
  "¿Cómo gano referidos?",
  "¿Es seguro?",
  "¿Qué es BLACKBLOK?",
];

function _faqFind(text) {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const entry of CHAT_KB) {
    if (entry.keys.some(k => t.includes(k))) return entry.ans;
  }
  return null;
}

function _faqBotReply(text) {
  const ans = _faqFind(text);
  if (ans) return ans;
  return "No encontré una respuesta exacta para eso. Prueba con: 'comprar tickets', 'NXL', 'referidos', 'seguridad', 'BLACKBLOK', o 'gas'. También puedes ver los acordeones de arriba. 👆";
}

function _appendMessage(role, text) {
  const box = document.getElementById("chat-messages");
  if (!box) return;
  const isBot = role === "bot";
  const wrapper = document.createElement("div");
  wrapper.className = "flex gap-3" + (isBot ? "" : " justify-end");

  if (isBot) {
    wrapper.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-[#00FF41]/20 border border-[#00FF41]/40 flex items-center justify-center flex-shrink-0 text-sm">⚡</div>
      <div class="bg-[#00FF41]/10 border border-[#00FF41]/20 rounded-2xl rounded-tl-none px-4 py-3 max-w-[82%]">
        <p class="text-gray-200 text-sm leading-relaxed">${text.replace(/\n/g,"<br>")}</p>
        <p class="text-[#00FF41]/40 text-xs mt-1">NEXALO Bot</p>
      </div>`;
  } else {
    wrapper.innerHTML = `
      <div class="bg-gray-800 border border-gray-700 rounded-2xl rounded-tr-none px-4 py-3 max-w-[82%]">
        <p class="text-gray-200 text-sm">${text}</p>
        <p class="text-gray-500 text-xs mt-1">Tú</p>
      </div>
      <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm">👤</div>`;
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
    <div class="w-8 h-8 rounded-full bg-[#00FF41]/20 border border-[#00FF41]/40 flex items-center justify-center flex-shrink-0 text-sm">⚡</div>
    <div class="bg-[#00FF41]/10 border border-[#00FF41]/20 rounded-2xl rounded-tl-none px-4 py-3">
      <span class="inline-flex gap-1">
        <span class="w-2 h-2 bg-[#00FF41]/60 rounded-full animate-bounce" style="animation-delay:0ms"></span>
        <span class="w-2 h-2 bg-[#00FF41]/60 rounded-full animate-bounce" style="animation-delay:150ms"></span>
        <span class="w-2 h-2 bg-[#00FF41]/60 rounded-full animate-bounce" style="animation-delay:300ms"></span>
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

  FAQ_DATA.forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "bg-black/50 border border-gray-800 hover:border-[#00FF41]/40 rounded-xl overflow-hidden transition-all";
    el.innerHTML = `
      <button
        class="w-full text-left px-6 py-4 flex items-center justify-between gap-4 focus:outline-none group"
        onclick="toggleFAQ(${i})"
        aria-expanded="false"
        id="faq-btn-${i}"
      >
        <span class="font-bold text-gray-100 group-hover:text-[#00FF41] transition text-sm md:text-base">${item.q}</span>
        <span id="faq-icon-${i}" class="text-[#00FF41] text-xl flex-shrink-0 transition-transform duration-300">+</span>
      </button>
      <div id="faq-body-${i}" class="hidden px-6 pb-5">
        <p class="text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">${item.a}</p>
        <button
          onclick="sendFAQToChat(${i})"
          class="mt-3 text-xs text-[#00FF41]/70 hover:text-[#00FF41] transition underline underline-offset-2"
        >Preguntar al chat ↗</button>
      </div>`;
    container.appendChild(el);
  });
}

function toggleFAQ(i) {
  const body = document.getElementById(`faq-body-${i}`);
  const icon = document.getElementById(`faq-icon-${i}`);
  const btn  = document.getElementById(`faq-btn-${i}`);
  if (!body) return;

  const isOpen = !body.classList.contains("hidden");

  // Cerrar todos
  FAQ_DATA.forEach((_, j) => {
    document.getElementById(`faq-body-${j}`)?.classList.add("hidden");
    const ic = document.getElementById(`faq-icon-${j}`);
    if (ic) { ic.textContent = "+"; ic.style.transform = "rotate(0deg)"; }
    document.getElementById(`faq-btn-${j}`)?.setAttribute("aria-expanded", "false");
  });

  if (!isOpen) {
    body.classList.remove("hidden");
    icon.textContent = "−";
    icon.style.transform = "rotate(180deg)";
    btn.setAttribute("aria-expanded", "true");
  }
}

function sendFAQToChat(i) {
  // Scroll to chat
  document.getElementById("chat-messages")?.scrollIntoView({ behavior: "smooth" });
  sendChatMessage(FAQ_DATA[i].q);
}

function _buildChips() {
  const container = document.getElementById("quick-chips");
  if (!container) return;
  container.innerHTML = "";
  QUICK_QUESTIONS.forEach(q => {
    const btn = document.createElement("button");
    btn.className = "text-xs bg-[#00FF41]/10 border border-[#00FF41]/30 text-[#00FF41] px-3 py-1.5 rounded-full hover:bg-[#00FF41]/20 transition";
    btn.textContent = q;
    btn.onclick = () => sendChatMessage(q);
    container.appendChild(btn);
  });
}

// Init when FAQ section becomes visible
(function initFAQ() {
  function tryInit() {
    if (document.getElementById("faq-list")) {
      _buildFAQ();
      _buildChips();
    } else {
      setTimeout(tryInit, 200);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryInit);
  } else {
    tryInit();
  }
})();

window.sendChatMessage = sendChatMessage;
window.toggleFAQ       = toggleFAQ;
window.sendFAQToChat   = sendFAQToChat;
