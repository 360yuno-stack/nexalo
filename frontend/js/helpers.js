// ═══════════════════════════════════════════════════════
// NEXALO — JS Helpers: calcROI, provideLiquidity, claimStable
// ═══════════════════════════════════════════════════════

/**
 * calcROI — Simulates ROI for investor liquidity provision
 * Uses CONFIG.PRODUCTS data for pool size / ticket price
 */
function calcROI() {
  const amount = parseFloat(document.getElementById('roi-amount')?.value) || 0;
  const productIdx = parseInt(document.getElementById('roi-product')?.value) || 0;
  const rounds = parseInt(document.getElementById('roi-rounds')?.value) || 1;

  if (amount <= 0) { alert('Ingresa un monto válido'); return; }

  const product = CONFIG.PRODUCTS[productIdx];
  if (!product) { alert('Producto no encontrado'); return; }

  // On-chain model: PCT_INVESTOR = 300 bps = 3% ROI per round on invested capital
  // Investor earns 3% of their principal for each completed round
  const roiPerRound = 0.03; // 3% per round (PCT_INVESTOR = 300 bps)
  const profitPerRound = amount * roiPerRound;

  const totalReturn = profitPerRound * rounds;
  const roiPct = (totalReturn / amount * 100).toFixed(1);
  const totalWithCapital = amount + totalReturn;

  // Show results
  const resultsDiv = document.getElementById('roi-results');
  if (resultsDiv) resultsDiv.classList.remove('hidden');

  const retEl = document.getElementById('roi-return');
  if (retEl) retEl.textContent = '$' + totalReturn.toLocaleString(undefined, {maximumFractionDigits: 2});

  const pctEl = document.getElementById('roi-percentage');
  if (pctEl) pctEl.textContent = roiPct + '%';

  const totEl = document.getElementById('roi-total');
  if (totEl) totEl.textContent = '$' + totalWithCapital.toLocaleString(undefined, {maximumFractionDigits: 2});
}

/**
 * provideLiquidity — Deposits USDT into a Nexum liquidity pool
 * @param {number} productId - The Nexum product ID (0-5)
 */
async function provideLiquidity(productId) {
  try {
    if (!S.mgr || !S.account) {
      alert('Conecta tu wallet primero');
      return;
    }

    const inputEl = document.getElementById('inv-input-' + productId);
    if (!inputEl) return;

    const val = parseFloat(inputEl.value);
    if (!val || val <= 0) {
      alert('Ingresa un monto válido de USDT');
      return;
    }

    const product = CONFIG.PRODUCTS.find(p => p.id === productId);
    if (!product) { alert('Producto no encontrado'); return; }

    if (!confirm(`Aportar ${val} USDT a la pool ${product.name}\n\nTu capital será devuelto + ganancias al cierre de la ronda.\n\n¿Confirmar?`)) return;

    // Approve USDT
    await ensureUSDTApproval(val);

    // For now, provideLiquidity maps to the NexumManager
    // In production this would call a dedicated LiquidityPool contract
    alert('⏳ Función de liquidez en integración final. El contrato LiquidityPool será desplegado en mainnet.');

  } catch (e) {
    alert('❌ ' + (e.data?.message || e.message || e));
  }
}

/**
 * claimStable — Wrapper that calls claimStableFromManager
 * Exposed for UI buttons in new sections
 */
async function claimStable() {
  await claimStableFromManager();
}

/**
 * Render investor pool cards dynamically from CONFIG.PRODUCTS
 */
function renderInvestorPools() {
  const grid = document.getElementById('investor-pools-grid');
  if (!grid) return;

  const colors = {
    0: { accent: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)' },
    1: { accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)' },
    2: { accent: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.20)' },
    3: { accent: '#38BDF8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.20)' },
    4: { accent: '#F472B6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.20)' },
    5: { accent: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.20)' }
  };

  grid.innerHTML = CONFIG.PRODUCTS.map(p => {
    const c = colors[p.id] || colors[0];
    const poolSize = (p.price * p.maxTickets).toLocaleString();
    return `
      <div class="card-hover rounded-2xl p-6" style="background:${c.bg}; border:1px solid ${c.border}; backdrop-filter:blur(20px);">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${p.emoji}</span>
            <h4 class="font-display font-bold text-white text-lg">${p.name}</h4>
          </div>
          <span class="text-xs font-semibold px-2 py-1 rounded-full" style="background:${c.bg}; color:${c.accent}; border:1px solid ${c.border};">Ronda Activa</span>
        </div>

        <div class="space-y-3 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Precio / Ticket</span>
            <span class="text-white font-semibold">$${p.price} USDT</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Pool Total</span>
            <span class="text-white font-semibold">$${poolSize}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Liquidez Fondeada</span>
            <span class="font-semibold" style="color:${c.accent};">$<span id="inv-funded-${p.id}">0.00</span></span>
          </div>

          <div class="progress-track">
            <div class="progress-fill" id="inv-progress-${p.id}" style="width:0%; background:${c.accent};"></div>
          </div>
        </div>

        <div class="flex gap-2">
          <input type="number" id="inv-input-${p.id}" placeholder="USDT" min="1"
            class="flex-1 bg-white/10 border border-white/20 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-white/15 focus:border-blue-400/50 transition font-mono font-bold placeholder-slate-400">
          <button onclick="provideLiquidity(${p.id})"
            class="px-4 py-2 rounded-lg text-sm font-bold transition hover:scale-105"
            style="background:${c.accent}; color:#000;">
            APORTAR
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Update account section with wallet data
 */
function refreshAccountSection() {
  const addrEl = document.getElementById('acc-wallet-address');
  if (addrEl) addrEl.value = S.account || 'No conectada';

  const noWallet = document.getElementById('account-no-wallet');
  if (noWallet) noWallet.style.display = S.account ? 'none' : 'block';
}

// ═══════════════════════════════════════════════════════
// Boot: render pools on load, expose functions
// ═══════════════════════════════════════════════════════
window.addEventListener('load', () => {
  renderInvestorPools();
  refreshAccountSection();
});

// Expose to window for onclick handlers
window.calcROI = calcROI;
window.provideLiquidity = provideLiquidity;
window.claimStable = claimStable;
window.renderInvestorPools = renderInvestorPools;
window.refreshAccountSection = refreshAccountSection;
