'use client';

const PARTNERS = [
  { name: "Visa",       logo: "💳", color: "#1A1F71" },
  { name: "Mastercard", logo: "💳", color: "#EB001B" },
  { name: "Apple Pay",  logo: "🍎", color: "#000000" },
  { name: "Google Pay", logo: "🎯", color: "#4285F4" },
  { name: "Transak",   logo: "⚡", color: "#3B82F6" },
  { name: "Moonpay",   logo: "🌙", color: "#7C3AED" },
];

const STEPS = [
  {
    num: "01",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2"/>
        <path d="M3 10h18M7 15h.01"/>
      </svg>
    ),
    title: "Pagas con Tarjeta a Transak",
    desc: "Transak / Moonpay procesan el pago. Son proveedores regulados — NEXALO nunca toca ni ve esos fondos."
  },
  {
    num: "02",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    title: "USDT directo a tu Wallet",
    desc: "Transak convierte y envía el USDT directamente a tu wallet BSC. Sin intermediarios. Sin custodia de NEXALO."
  },
  {
    num: "03",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: "El Smart Contract toma el control",
    desc: "Con USDT en tu wallet, firmas la transacción al contrato autónomo. Desde aquí todo es on-chain, sin humanos."
  },
];

export function FiatPaymentSection() {
  return (
    <section
      className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden"
      id="fiat"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Próximamente</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">
            Cripto ↔ <span className="text-glow-blue text-[var(--blue)]">Mundo Real</span>
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            Conectamos el ecosistema DeFi con los pagos tradicionales. Compra USDT directamente con tu tarjeta
            bancaria y entra al protocolo en minutos, sin pasar por un exchange.
          </p>
        </div>

        {/* Main card */}
        <div className="glass rounded-3xl p-8 md:p-12 mb-10"
          style={{ border: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 0 60px rgba(59,130,246,0.04)" }}>

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left: Steps */}
            <div>
              <p className="text-[var(--blue)] font-semibold text-sm uppercase tracking-widest mb-8">
                ¿Cómo funciona?
              </p>
              <div className="space-y-8">
                {STEPS.map((s) => (
                  <div key={s.num} className="flex gap-5 items-start group">
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-[var(--blue)] transition-all group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                      {s.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[var(--muted)] font-mono">{s.num}</span>
                        <h3 className="font-bold text-white">{s.title}</h3>
                      </div>
                      <p className="text-[var(--muted)] text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Preview card */}
            <div className="flex flex-col gap-6">
              {/* Mock payment widget */}
              <div className="rounded-2xl p-6 relative overflow-hidden"
                style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)" }}>

                {/* Coming soon overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]"
                  style={{ background: "rgba(8,11,18,0.7)" }}>
                  <div className="text-center">
                    <div className="text-5xl mb-3">🔒</div>
                    <p className="text-white font-bold text-lg mb-1">En Desarrollo</p>
                    <p className="text-[var(--muted)] text-sm max-w-[220px] text-center">
                      Integración con Transak y Moonpay. Disponible al lanzar Mainnet.
                    </p>
                  </div>
                </div>

                {/* Blurred mock UI */}
                <div className="opacity-30 blur-[1px]">
                  <p className="text-xs text-[var(--muted)] mb-2">Monto en EUR/USD</p>
                  <div className="bg-[#060810] rounded-xl p-4 mb-4 border border-[rgba(255,255,255,0.05)]">
                    <span className="text-3xl font-mono font-bold text-white">€ 100.00</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-2">Recibirás aprox.</p>
                  <div className="bg-[#060810] rounded-xl p-4 mb-4 border border-[rgba(255,255,255,0.05)] flex justify-between">
                    <span className="text-xl font-mono font-bold text-emerald-400">≈ 94.50 USDT</span>
                    <span className="text-xs text-[var(--muted)] self-center">BSC</span>
                  </div>
                  <button className="w-full py-4 rounded-xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)" }}>
                    Pagar con Tarjeta →
                  </button>
                </div>
              </div>

              {/* Trust metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "KYC ligero", icon: "✅" },
                  { label: "Sin wallet previa", icon: "🚀" },
                  { label: "SSL / PCI DSS", icon: "🔒" },
                ].map((m) => (
                  <div key={m.label} className="text-center p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="text-xl mb-1">{m.icon}</div>
                    <p className="text-xs text-[var(--muted)]">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Partners row */}
        <div className="text-center mb-6">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-5">Métodos de pago soportados</p>
          <div className="flex flex-wrap justify-center gap-4">
            {PARTNERS.map((p) => (
              <div key={p.name}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-lg">{p.logo}</span>
                <span className="text-sm font-semibold text-white">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        <p className="text-center text-xs text-[var(--muted)] opacity-50">
          * La integración fiat está sujeta a regulaciones KYC/AML del proveedor.
          NEXALO no almacena datos de tarjetas — el pago es procesado íntegramente por Transak / Moonpay.
        </p>
      </div>
    </section>
  );
}
