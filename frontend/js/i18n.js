/**
 * NEXALO — Sistema de Internacionalización (i18n)
 * Soporta: Español (es), English (en), Português (pt)
 * Uso: i18n.t('key') → texto en idioma activo
 */

const NEXALO_TRANSLATIONS = {
  es: {
    // NAV
    nav_nexum: "Nexum",
    nav_account: "Mi Cuenta",
    nav_ambassadors: "Embajadores",
    nav_staking: "Staking",
    nav_videos: "Videos",
    nav_tokenomics: "Tokenomics",
    nav_faq: "FAQ",
    nav_connect: "Conectar",
    nav_disconnect: "Desconectar",

    // HERO
    hero_subtitle: "Sistema Autónomo de Lotería Descentralizada",
    hero_desc: "Participa en sorteos 100% transparentes verificados en blockchain. Elige tus números de la suerte y recibe tokens NXL automáticamente.",

    // PRODUCTS
    products_title: "PRODUCTOS NEXUM DISPONIBLES",
    products_subtitle: "Elige tus números de la suerte o cómpralos aleatorios",
    products_pay: "💰 Paga con USDT - Recibe NXL automáticamente",
    products_update: "📡 Progreso se actualiza solo cada 15s (sin conectar wallet)",
    btn_buy3: "🎲 3",
    btn_buy5: "🎲 5",
    btn_buy10: "🎲 10",
    btn_pick: "🎯 ELEGIR MIS NÚMEROS",
    label_prize: "PREMIO",
    label_per_number: "por número",
    label_numbers: "números",
    label_range: "Rango",

    // DISTRIBUTION
    dist_title: "DISTRIBUCIÓN TRANSPARENTE DE FONDOS",
    dist_subtitle: "Cada compra se distribuye automáticamente en blockchain",
    dist_prize: "Premio Principal",
    dist_prize_desc: "Pool acumulado para el ganador",
    dist_instant: "Recompensas Instantáneas",
    dist_instant_desc: "Airdrops y bonos para holders",
    dist_multilevel: "Red Multinivel",
    dist_multilevel_desc: "Sistema de 3 niveles (5% + 3% + 2%)",
    dist_treasury: "Treasury DAO (BTC)",
    dist_treasury_desc: "Reserva en Bitcoin para la comunidad",
    dist_ambassadors: "Comisión Embajadores",
    dist_ambassadors_desc: "Para quienes refieren usuarios",
    dist_ops: "Operaciones",
    dist_ops_desc: "Fundador, liquidez, gastos operativos y partners",
    dist_total: "Distribución Total Verificada",
    dist_auditable: "✅ Auditable en blockchain",

    // ACCOUNT
    account_title: "MI CUENTA",
    account_nxl_balance: "BALANCE NXL",
    account_my_tickets: "MIS NÚMEROS",
    account_connect_prompt: "Conecta tu wallet para ver tus números",
    account_claim_stable: "💰 Reclamar USDT",
    account_claim_nxl: "🪙 Reclamar NXL",
    account_redeem: "₿ Canjear NXL por Treasury",
    account_claimable: "Reclamable",
    account_invested: "Invertido",
    account_returns: "Retornos",

    // AMBASSADORS
    amb_title: "PROGRAMA DE EMBAJADORES",
    amb_subtitle: "Gana comisiones en USDT por cada persona que refieras",
    amb_how_title: "💰 ¿CÓMO ME LLEVO EL 5%?",
    amb_step_title: "🎯 PASO A PASO",
    amb_step1: "Conecta tu wallet en NEXALO",
    amb_step2: "Copia tu link único de referido",
    amb_step3: "Comparte en redes sociales, amigos, familia",
    amb_step4: "Cuando compren números → Recibes 5% en USDT de tus referidos directos",

    // STAKING
    staking_title: "STAKING NXL",
    staking_subtitle: "Bloquea NXL y gana WBTC",
    staking_amount: "Cantidad a stakear",
    staking_btn: "⚡ STAKEAR",

    // VIDEOS
    videos_title: "TUTORIALES NEXALO",
    videos_subtitle: "Aprende a usar el protocolo paso a paso",

    // TOKENOMICS
    token_title: "TOKENOMICS NXL",
    token_subtitle: "Distribución del suministro total",

    // FAQ
    faq_title: "PREGUNTAS FRECUENTES",
    faq_subtitle: "¿Tienes dudas? Escríbenos o busca en las respuestas más comunes",
    faq_chat_label: "NEXALO ASSISTANT",
    faq_chat_sublabel: "Respuestas instantáneas",
    faq_chat_greeting: "¡Hola! Soy el asistente de NEXALO. ¿En qué puedo ayudarte?",
    faq_placeholder: "Escribe tu pregunta...",
    faq_send: "ENVIAR",
    faq_quick_label: "Preguntas rápidas:",
    faq_ask_chat: "Preguntar al chat ↗",

    // WALLET
    wallet_modal_title: "CONECTAR WALLET",
    wallet_modal_subtitle: "Elige cómo quieres conectar",
    wallet_metamask: "🦊 MetaMask / Wallet del navegador",
    wallet_wc: "📱 WalletConnect (QR / Móvil)",
    wallet_disconnect: "🔌 Desconectar",
    wallet_close: "❌ Cerrar",

    // MISC
    popular: "POPULAR",
    mega: "MEGA",
    testnet_warning: "⚠️ Actualmente en BSC Testnet - Usa tBNB del faucet",
    copyright: "© 2025 NEXALO - Powered by BSC Testnet",
    network_bsc: "BSC Testnet",
    supply_total: "📊 Supply Total:",
    distribution_label: "🎯 Distribución:",
    nxl_price_label: "💵 Precio NXL:",
    nxl_price_value: "Lo define el mercado (sin precio fijo ni promesas)",
    in_development: "🏗️ En desarrollo:",
  },

  en: {
    nav_nexum: "Nexum",
    nav_account: "My Account",
    nav_ambassadors: "Ambassadors",
    nav_staking: "Staking",
    nav_videos: "Videos",
    nav_tokenomics: "Tokenomics",
    nav_faq: "FAQ",
    nav_connect: "Connect",
    nav_disconnect: "Disconnect",

    hero_subtitle: "Autonomous Decentralized Lottery System",
    hero_desc: "Join 100% transparent draws verified on blockchain. Pick your lucky numbers and receive NXL tokens automatically.",

    products_title: "AVAILABLE NEXUM PRODUCTS",
    products_subtitle: "Choose your lucky numbers or buy random ones",
    products_pay: "💰 Pay with USDT - Receive NXL automatically",
    products_update: "📡 Progress updates every 15s (no wallet needed)",
    btn_buy3: "🎲 3",
    btn_buy5: "🎲 5",
    btn_buy10: "🎲 10",
    btn_pick: "🎯 PICK MY NUMBERS",
    label_prize: "PRIZE",
    label_per_number: "per number",
    label_numbers: "numbers",
    label_range: "Range",

    dist_title: "TRANSPARENT FUND DISTRIBUTION",
    dist_subtitle: "Every purchase is automatically distributed on blockchain",
    dist_prize: "Main Prize",
    dist_prize_desc: "Accumulated pool for the winner",
    dist_instant: "Instant Rewards",
    dist_instant_desc: "Airdrops and bonuses for holders",
    dist_multilevel: "Multilevel Network",
    dist_multilevel_desc: "3-level system (5% + 3% + 2%)",
    dist_treasury: "Treasury DAO (BTC)",
    dist_treasury_desc: "Bitcoin reserve for the community",
    dist_ambassadors: "Ambassador Commission",
    dist_ambassadors_desc: "For those who refer users",
    dist_ops: "Operations",
    dist_ops_desc: "Founder, liquidity, operating costs and partners",
    dist_total: "Verified Total Distribution",
    dist_auditable: "✅ Auditable on blockchain",

    account_title: "MY ACCOUNT",
    account_nxl_balance: "NXL BALANCE",
    account_my_tickets: "MY NUMBERS",
    account_connect_prompt: "Connect your wallet to see your numbers",
    account_claim_stable: "💰 Claim USDT",
    account_claim_nxl: "🪙 Claim NXL",
    account_redeem: "₿ Redeem NXL for Treasury",
    account_claimable: "Claimable",
    account_invested: "Invested",
    account_returns: "Returns",

    amb_title: "AMBASSADOR PROGRAM",
    amb_subtitle: "Earn USDT commissions for every person you refer",
    amb_how_title: "💰 HOW DO I GET MY 5%?",
    amb_step_title: "🎯 STEP BY STEP",
    amb_step1: "Connect your wallet on NEXALO",
    amb_step2: "Copy your unique referral link",
    amb_step3: "Share on social media, friends, family",
    amb_step4: "When they buy numbers → You get 5% in USDT from your direct referrals",

    staking_title: "NXL STAKING",
    staking_subtitle: "Lock NXL and earn WBTC",
    staking_amount: "Amount to stake",
    staking_btn: "⚡ STAKE",

    videos_title: "NEXALO TUTORIALS",
    videos_subtitle: "Learn to use the protocol step by step",

    token_title: "NXL TOKENOMICS",
    token_subtitle: "Total supply distribution",

    faq_title: "FREQUENTLY ASKED QUESTIONS",
    faq_subtitle: "Have questions? Chat with us or browse common answers",
    faq_chat_label: "NEXALO ASSISTANT",
    faq_chat_sublabel: "Instant answers",
    faq_chat_greeting: "Hi! I'm the NEXALO assistant. How can I help you?",
    faq_placeholder: "Type your question...",
    faq_send: "SEND",
    faq_quick_label: "Quick questions:",
    faq_ask_chat: "Ask the chat ↗",

    wallet_modal_title: "CONNECT WALLET",
    wallet_modal_subtitle: "Choose how you want to connect",
    wallet_metamask: "🦊 MetaMask / Browser Wallet",
    wallet_wc: "📱 WalletConnect (QR / Mobile)",
    wallet_disconnect: "🔌 Disconnect",
    wallet_close: "❌ Close",

    popular: "POPULAR",
    mega: "MEGA",
    testnet_warning: "⚠️ Currently on BSC Testnet - Use tBNB from faucet",
    copyright: "© 2025 NEXALO - Powered by BSC Testnet",
    network_bsc: "BSC Testnet",
    supply_total: "📊 Total Supply:",
    distribution_label: "🎯 Distribution:",
    nxl_price_label: "💵 NXL Price:",
    nxl_price_value: "Market-driven (no fixed price or promises)",
    in_development: "🏗️ In development:",
  },

  pt: {
    nav_nexum: "Nexum",
    nav_account: "Minha Conta",
    nav_ambassadors: "Embaixadores",
    nav_staking: "Staking",
    nav_videos: "Vídeos",
    nav_tokenomics: "Tokenomics",
    nav_faq: "FAQ",
    nav_connect: "Conectar",
    nav_disconnect: "Desconectar",

    hero_subtitle: "Sistema Autônomo de Loteria Descentralizada",
    hero_desc: "Participe de sorteios 100% transparentes verificados na blockchain. Escolha seus números da sorte e receba tokens NXL automaticamente.",

    products_title: "PRODUTOS NEXUM DISPONÍVEIS",
    products_subtitle: "Escolha seus números da sorte ou compre aleatórios",
    products_pay: "💰 Pague com USDT - Receba NXL automaticamente",
    products_update: "📡 Progresso atualiza a cada 15s (sem conectar carteira)",
    btn_buy3: "🎲 3",
    btn_buy5: "🎲 5",
    btn_buy10: "🎲 10",
    btn_pick: "🎯 ESCOLHER MEUS NÚMEROS",
    label_prize: "PRÊMIO",
    label_per_number: "por número",
    label_numbers: "números",
    label_range: "Intervalo",

    dist_title: "DISTRIBUIÇÃO TRANSPARENTE DE FUNDOS",
    dist_subtitle: "Cada compra é distribuída automaticamente na blockchain",
    dist_prize: "Prêmio Principal",
    dist_prize_desc: "Pool acumulado para o vencedor",
    dist_instant: "Recompensas Instantâneas",
    dist_instant_desc: "Airdrops e bônus para holders",
    dist_multilevel: "Rede Multinível",
    dist_multilevel_desc: "Sistema de 3 níveis (5% + 3% + 2%)",
    dist_treasury: "Treasury DAO (BTC)",
    dist_treasury_desc: "Reserva em Bitcoin para a comunidade",
    dist_ambassadors: "Comissão de Embaixadores",
    dist_ambassadors_desc: "Para quem indica usuários",
    dist_ops: "Operações",
    dist_ops_desc: "Fundador, liquidez, custos operacionais e parceiros",
    dist_total: "Distribuição Total Verificada",
    dist_auditable: "✅ Auditável na blockchain",

    account_title: "MINHA CONTA",
    account_nxl_balance: "SALDO NXL",
    account_my_tickets: "MEUS NÚMEROS",
    account_connect_prompt: "Conecte sua carteira para ver seus números",
    account_claim_stable: "💰 Resgatar USDT",
    account_claim_nxl: "🪙 Resgatar NXL",
    account_redeem: "₿ Trocar NXL por Treasury",
    account_claimable: "Resgatável",
    account_invested: "Investido",
    account_returns: "Retornos",

    amb_title: "PROGRAMA DE EMBAIXADORES",
    amb_subtitle: "Ganhe comissões em USDT por cada pessoa que indicar",
    amb_how_title: "💰 COMO RECEBO OS 5%?",
    amb_step_title: "🎯 PASSO A PASSO",
    amb_step1: "Conecte sua carteira no NEXALO",
    amb_step2: "Copie seu link único de indicação",
    amb_step3: "Compartilhe nas redes sociais, amigos, família",
    amb_step4: "Quando comprarem números → Você recebe 5% em USDT das suas indicações diretas",

    staking_title: "STAKING NXL",
    staking_subtitle: "Bloqueie NXL e ganhe WBTC",
    staking_amount: "Quantidade para fazer stake",
    staking_btn: "⚡ FAZER STAKE",

    videos_title: "TUTORIAIS NEXALO",
    videos_subtitle: "Aprenda a usar o protocolo passo a passo",

    token_title: "TOKENOMICS NXL",
    token_subtitle: "Distribuição do fornecimento total",

    faq_title: "PERGUNTAS FREQUENTES",
    faq_subtitle: "Tem dúvidas? Fale conosco ou busque nas respostas comuns",
    faq_chat_label: "ASSISTENTE NEXALO",
    faq_chat_sublabel: "Respostas instantâneas",
    faq_chat_greeting: "Olá! Sou o assistente NEXALO. Como posso ajudá-lo?",
    faq_placeholder: "Digite sua pergunta...",
    faq_send: "ENVIAR",
    faq_quick_label: "Perguntas rápidas:",
    faq_ask_chat: "Perguntar no chat ↗",

    wallet_modal_title: "CONECTAR CARTEIRA",
    wallet_modal_subtitle: "Escolha como deseja conectar",
    wallet_metamask: "🦊 MetaMask / Carteira do navegador",
    wallet_wc: "📱 WalletConnect (QR / Móvel)",
    wallet_disconnect: "🔌 Desconectar",
    wallet_close: "❌ Fechar",

    popular: "POPULAR",
    mega: "MEGA",
    testnet_warning: "⚠️ Atualmente na BSC Testnet - Use tBNB do faucet",
    copyright: "© 2025 NEXALO - Powered by BSC Testnet",
    network_bsc: "BSC Testnet",
    supply_total: "📊 Supply Total:",
    distribution_label: "🎯 Distribuição:",
    nxl_price_label: "💵 Preço NXL:",
    nxl_price_value: "Definido pelo mercado (sem preço fixo ou promessas)",
    in_development: "🏗️ Em desenvolvimento:",
  }
};

// ──────────────────────────────────────────
// Core i18n engine
// ──────────────────────────────────────────
const i18n = (() => {
  const STORAGE_KEY = "nexalo_lang";
  const SUPPORTED   = ["es", "en", "pt"];
  let _lang = localStorage.getItem(STORAGE_KEY) || navigator.language?.slice(0,2) || "es";
  if (!SUPPORTED.includes(_lang)) _lang = "es";

  function t(key) {
    return (NEXALO_TRANSLATIONS[_lang] || NEXALO_TRANSLATIONS.es)[key]
        || NEXALO_TRANSLATIONS.es[key]
        || key;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    _lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyAll();
    document.documentElement.lang = lang;
    // Re-render FAQ chat in new language
    if (typeof _buildFAQ === "function") _buildFAQ();
    if (typeof _buildChips === "function") _buildChips();
  }

  function getLang() { return _lang; }

  /** Apply all data-i18n attributes */
  function applyAll() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      const val = t(key);
      if (attr) { el.setAttribute(attr, val); }
      else { el.textContent = val; }
    });
    // Update lang selector highlight
    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.classList.toggle("active-lang", btn.dataset.lang === _lang);
    });
  }

  return { t, setLang, getLang, applyAll };
})();

window.i18n = i18n;
window.setLang = (l) => i18n.setLang(l);

// Apply on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => i18n.applyAll());
} else {
  i18n.applyAll();
}
