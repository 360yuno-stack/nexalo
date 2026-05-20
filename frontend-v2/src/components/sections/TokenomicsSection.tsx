'use client';

export function TokenomicsSection() {
  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden" id="tokenomics">
      <div className="max-w-[1200px] mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">Tokenomics <span className="text-glow-blue text-[var(--blue)]">NXL</span></h2>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto mb-16">
          El token NXL es el corazón del ecosistema. Diseñado con una economía deflacionaria y un sistema de liquidez garantizado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-[1000px] mx-auto">
          {/* Token Info */}
          <div className="text-left">
            <div className="glass p-8 rounded-2xl mb-6">
              <h3 className="text-xl font-bold mb-6 border-b border-[var(--border)] pb-4">Especificaciones</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Suministro Máximo</span>
                  <span className="font-bold font-mono">1,000,000,000 NXL</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Red</span>
                  <span className="font-bold font-mono">BNB Smart Chain (BEP-20)</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Precio de Respaldo Actual</span>
                  <span className="font-bold font-mono text-[var(--emerald)]">$0.0012 USDT</span>
                </li>
              </ul>
            </div>
            
            <div className="glass-blue p-8 rounded-2xl">
              <h3 className="text-xl font-bold mb-2">Liquidity Backing</h3>
              <p className="text-[var(--muted)] text-sm mb-4">
                El 4% de todo el volumen entrante se reserva permanentemente en USDT para garantizar liquidez de salida (Redeem).
              </p>
              <div className="w-full bg-[rgba(255,255,255,0.05)] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-[var(--blue)] w-[4%] shadow-[0_0_10px_#3B82F6]"></div>
              </div>
            </div>
          </div>

          {/* Exchange / Redeem */}
          <div className="glass p-8 rounded-2xl flex flex-col justify-center border border-[var(--blue)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] opacity-[0.05] rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-2xl font-bold mb-6 font-display text-left">Ventana de Liquidez (Redeem)</h3>
            
            <div className="bg-[rgba(0,0,0,0.3)] p-6 rounded-xl border border-[var(--border)] mb-6 text-left">
              <label className="block text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-2">NXL a Quemar</label>
              <input type="number" placeholder="0" className="w-full bg-transparent text-3xl font-mono text-white outline-none mb-2" />
              <span className="text-xs text-[var(--muted)]">Balance: 0.00 NXL</span>
            </div>

            <div className="text-center mb-6 text-[var(--muted)]">
              ↓
            </div>

            <div className="bg-[rgba(0,0,0,0.3)] p-6 rounded-xl border border-[rgba(16,185,129,0.3)] mb-6 text-left">
              <label className="block text-xs text-[var(--emerald)] uppercase tracking-widest font-bold mb-2">USDT a Recibir</label>
              <div className="text-3xl font-mono text-white">0.00</div>
            </div>

            <button className="btn-primary w-full py-4 font-bold text-lg cursor-not-allowed opacity-50" disabled>
              Ejecutar Redeem (Pronto)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
