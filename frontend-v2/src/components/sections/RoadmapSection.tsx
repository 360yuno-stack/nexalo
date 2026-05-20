'use client';

import { useState } from 'react';

const PHASES = [
  {
    id: 1,
    label: "FASE 1",
    title: "Pre-Mainnet",
    period: "Inmediato",
    status: "active",
    color: "emerald",
    items: [
      { icon: "⚡", title: "Meta-Transactions (Gasless)", desc: "Comprar tickets sin tener BNB. El gas se deduce del USDT del ticket." },
      { icon: "📱", title: "Progressive Web App (PWA)", desc: "Instalable en móvil. Notificaciones push cuando ganas. Sin App Store." },
      { icon: "🌍", title: "Multi-idioma (i18n)", desc: "Inglés, Portugués, Francés, Chino, Árabe. Acceso al mercado global." },
    ],
  },
  {
    id: 2,
    label: "FASE 2",
    title: "Post-Launch",
    period: "Meses 1–3",
    status: "planned",
    color: "blue",
    items: [
      { icon: "🔗", title: "Multi-Chain (Arbitrum + Base)", desc: "Puente NXL vía LayerZero. Acceso a 100M+ usuarios de Coinbase en Base." },
      { icon: "📊", title: "Dashboard Analytics Público", desc: "TVL en tiempo real, historial de ganadores verificable, API pública." },
      { icon: "🤖", title: "Keeper Bot Open-Source", desc: "Auto-settlement descentralizado. Incentivado con gas reimbursement." },
    ],
  },
  {
    id: 3,
    label: "FASE 3",
    title: "Crecimiento",
    period: "Meses 3–6",
    status: "planned",
    color: "gold",
    items: [
      { icon: "🏦", title: "Fiat On-Ramp Nativo", desc: "Compra tickets con tarjeta de crédito. Sin USDT previo. KYC mínimo." },
      { icon: "🎮", title: "Gamification Layer", desc: "Badges NFT, leaderboards de referidos, streaks con descuentos." },
      { icon: "⚖️", title: "Compliance Module", desc: "Geofencing por jurisdicción, responsible gaming limits, DAO legal wrapper." },
    ],
  },
  {
    id: 4,
    label: "FASE 4",
    title: "Dominio Global",
    period: "Meses 6–12",
    status: "future",
    color: "purple",
    items: [
      { icon: "🏛️", title: "DAO Governance con NXL", desc: "Votación on-chain para nuevos productos. veNXL para incentivos largo plazo." },
      { icon: "🔌", title: "SDK para Integradores", desc: "@nexalo/sdk — embed de lotería en cualquier dApp. White-label para protocolos." },
      { icon: "🛡️", title: "Insurance Pool", desc: "Cobertura de smart contract risk vía Nexus Mutual. Máxima confianza institucional." },
    ],
  },
];

const COLOR_MAP: Record<string, { pill: string; dot: string; border: string; glow: string; text: string }> = {
  emerald: { pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.1)", text: "text-emerald-400" },
  blue:    { pill: "bg-blue-500/15 text-blue-400 border-blue-500/30",       dot: "bg-blue-400",    border: "rgba(59,130,246,0.25)",  glow: "rgba(59,130,246,0.1)",  text: "text-blue-400"    },
  gold:    { pill: "bg-amber-500/15 text-amber-400 border-amber-500/30",    dot: "bg-amber-400",   border: "rgba(245,158,11,0.25)",  glow: "rgba(245,158,11,0.1)",  text: "text-amber-400"   },
  purple:  { pill: "bg-purple-500/15 text-purple-400 border-purple-500/30", dot: "bg-purple-400",  border: "rgba(167,139,250,0.25)", glow: "rgba(167,139,250,0.1)", text: "text-purple-400"  },
};

const STATUS_LABEL: Record<string, string> = {
  active:  "En Progreso",
  planned: "Planificado",
  future:  "Visión",
};

export function RoadmapSection() {
  const [activePhase, setActivePhase] = useState<number>(1);
  const phase = PHASES.find(p => p.id === activePhase)!;
  const c = COLOR_MAP[phase.color];

  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden" id="roadmap">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 65%)" }} />
      </div>

      <div className="max-w-[1100px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[var(--blue)] font-semibold text-sm uppercase tracking-widest mb-3">Hoja de Ruta</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">
            Roadmap <span className="text-glow-blue text-[var(--blue)]">2026 → 2027</span>
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            12 mejoras en 4 fases para llevar a Nexalo de 72/100 a 95/100 en competitividad global — superando a PoolTogether, PancakeSwap y todos los competidores.
          </p>
        </div>

        {/* Phase Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {PHASES.map(p => {
            const mc = COLOR_MAP[p.color];
            const isActive = activePhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                  isActive
                    ? `${mc.pill} shadow-[0_0_15px_${mc.glow}]`
                    : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.07)] text-[var(--muted)] hover:text-white hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                {p.label} — {p.title}
              </button>
            );
          })}
        </div>

        {/* Active Phase Card */}
        <div className="rounded-3xl p-8 md:p-10 transition-all duration-300"
          style={{ background: "#0d1117", border: `1px solid ${c.border}`, boxShadow: `0 0 60px ${c.glow}` }}>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest ${c.text}`}>{phase.label}</span>
              <h3 className="text-2xl font-bold text-white mt-1">{phase.title}</h3>
              <p className="text-[var(--muted)] text-sm mt-1">{phase.period}</p>
            </div>
            <span className={`self-start md:self-center px-4 py-1.5 rounded-full text-xs font-bold border ${c.pill}`}>
              <span className={`w-2 h-2 rounded-full ${c.dot} inline-block mr-2 animate-pulse`} />
              {STATUS_LABEL[phase.status]}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {phase.items.map((item, i) => (
              <div key={i} className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h4 className={`font-bold mb-2 ${c.text}`}>{item.title}</h4>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress timeline strip */}
        <div className="mt-10 flex items-center gap-0">
          {PHASES.map((p, i) => {
            const mc = COLOR_MAP[p.color];
            const isActive = p.id <= activePhase;
            return (
              <div key={p.id} className="flex items-center flex-1">
                <button
                  onClick={() => setActivePhase(p.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all shrink-0 ${
                    isActive ? `${mc.dot} border-transparent text-white shadow-[0_0_10px_${mc.glow}]` : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[var(--muted)]'
                  }`}
                >
                  {p.id}
                </button>
                {i < PHASES.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2" style={{ background: p.id < activePhase ? "#3B82F6" : "rgba(255,255,255,0.07)" }} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-0.5">
          {PHASES.map(p => (
            <span key={p.id} className="text-[10px] text-[var(--muted)] font-medium text-center flex-1">{p.period}</span>
          ))}
        </div>

        {/* Metrics row */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Score Actual",        value: "72/100", sub: "vs 55 PoolTogether", color: "text-[var(--blue)]" },
            { label: "Score Post-Fase 4",   value: "95/100", sub: "Dominio total",       color: "text-emerald-400"  },
            { label: "TVL Proyectado",       value: "$50M+",  sub: "Meses 6–12",          color: "text-amber-400"    },
            { label: "Usuarios Proyectados", value: "200K+",  sub: "Meses 6–12",          color: "text-purple-400"   },
          ].map(m => (
            <div key={m.label} className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className={`text-2xl font-bold font-display ${m.color}`}>{m.value}</p>
              <p className="text-[var(--muted)] text-xs mt-1">{m.label}</p>
              <p className="text-[var(--muted)] text-[10px] opacity-60">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
