'use client';

export function ImpactSection() {
  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden" id="impacto">
      <div className="max-w-[1200px] mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">Impacto <span className="text-glow-green text-[var(--emerald)]">Global</span></h2>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto mb-16">
          NEXALO no solo genera riqueza para sus usuarios. El 10% del volumen del protocolo es donado automáticamente a causas de impacto verificadas on-chain.
        </p>

        <div className="glass-emerald p-8 md:p-12 rounded-3xl max-w-[900px] mx-auto flex flex-col md:flex-row items-center gap-12 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--emerald)] opacity-[0.05] rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <div className="flex-1 z-10">
            <h3 className="text-2xl font-bold mb-4 font-display">Bóveda Filantrópica</h3>
            <p className="text-[var(--muted)] mb-6">
              Los fondos se envían a direcciones multi-sig públicas de ONGs registradas que aceptan criptomonedas. La comunidad decide mediante la DAO a qué causas apoyar.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <span className="text-xs text-[var(--muted)] block mb-1 uppercase tracking-widest font-bold">Donado Hasta Ahora</span>
                <div className="text-3xl font-mono font-bold text-glow-green text-[var(--emerald)]">$0.00</div>
              </div>
              <div>
                <span className="text-xs text-[var(--muted)] block mb-1 uppercase tracking-widest font-bold">Próxima Donación</span>
                <div className="text-3xl font-mono font-bold text-white">$0.00</div>
              </div>
            </div>
            <button className="btn-emerald py-3 px-8 font-bold">Ver Transacciones Solidarias</button>
          </div>

          <div className="w-full md:w-[300px] h-[300px] relative shrink-0 z-10">
            {/* Earth abstract representation */}
            <div className="absolute inset-0 border-[4px] border-[rgba(16,185,129,0.2)] rounded-full animate-[pulseGlow_4s_ease-in-out_infinite]"></div>
            <div className="absolute inset-4 border-[2px] border-[rgba(16,185,129,0.4)] rounded-full border-dashed animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center text-8xl drop-shadow-[0_0_30px_rgba(16,185,129,0.6)]">
              🌍
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
