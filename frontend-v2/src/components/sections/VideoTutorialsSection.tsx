'use client';

import { useState } from 'react';

const VIDEOS = [
  {
    id: 1,
    title: "¿Qué es NEXALO? El Protocolo Explicado",
    description: "Visión general del ecosistema DeFi autónomo: cómo funciona el smart contract, el VRF y la distribución automática del 100% del capital.",
    duration: "3:20",
    category: "Introducción",
    color: "blue",
    icon: "🎯",
    // Sustituir por el ID real de YouTube cuando esté listo:
    youtubeId: null,
  },
  {
    id: 2,
    title: "Conectar tu Wallet (MetaMask / TrustWallet)",
    description: "Paso a paso para configurar la red BSC en tu billetera móvil o de escritorio y conectarte al protocolo en segundos.",
    duration: "2:45",
    category: "Primeros Pasos",
    color: "emerald",
    icon: "🔗",
    youtubeId: null,
  },
  {
    id: 3,
    title: "Cómo Comprar Nexums y Ganar NXL",
    description: "Aprende a elegir tu Nexum, seleccionar números, hacer la compra con USDT y recibir automáticamente tus tokens NXL.",
    duration: "4:10",
    category: "Compra",
    color: "gold",
    icon: "🎫",
    youtubeId: null,
  },
  {
    id: 4,
    title: "Reclamar tus Premios y Comisiones",
    description: "Cómo verificar tu premio ganador en BSCScan, acceder a 'Mi Cuenta' y ejecutar el retiro directo a tu wallet sin intermediarios.",
    duration: "3:05",
    category: "Ganancias",
    color: "purple",
    icon: "💰",
    youtubeId: null,
  },
  {
    id: 5,
    title: "El Sistema de Inversores y Liquidez",
    description: "Entiende el modelo de Liquidity Providers: cómo proveer USDT a una ronda activa y recibir el 3% de ROI por ronda completada.",
    duration: "5:30",
    category: "Inversión",
    color: "green",
    icon: "📈",
    youtubeId: null,
  },
  {
    id: 6,
    title: "Red de Referidos y Embajadores",
    description: "Sistema de 3 niveles de comisiones: cómo compartir tu link de referido, registrarte como embajador y maximizar tus ingresos pasivos.",
    duration: "3:50",
    category: "Referidos",
    color: "pink",
    icon: "🤝",
    youtubeId: null,
  },
];

const COLOR_MAP: Record<string, { badge: string; glow: string; border: string; text: string }> = {
  blue:    { badge: "bg-blue-500/15 text-blue-400",    glow: "rgba(59,130,246,0.4)",  border: "rgba(59,130,246,0.3)",  text: "text-blue-400"    },
  emerald: { badge: "bg-emerald-500/15 text-emerald-400", glow: "rgba(16,185,129,0.4)", border: "rgba(16,185,129,0.3)", text: "text-emerald-400" },
  gold:    { badge: "bg-amber-500/15 text-amber-400",   glow: "rgba(245,158,11,0.4)", border: "rgba(245,158,11,0.3)", text: "text-amber-400"    },
  purple:  { badge: "bg-purple-500/15 text-purple-400", glow: "rgba(167,139,250,0.4)", border: "rgba(167,139,250,0.3)", text: "text-purple-400" },
  green:   { badge: "bg-green-500/15 text-green-400",   glow: "rgba(34,197,94,0.4)",  border: "rgba(34,197,94,0.3)",  text: "text-green-400"   },
  pink:    { badge: "bg-pink-500/15 text-pink-400",     glow: "rgba(236,72,153,0.4)", border: "rgba(236,72,153,0.3)", text: "text-pink-400"    },
};

export function VideoTutorialsSection() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden" id="tutoriales">
      {/* Background orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)" }} />

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[var(--blue)] font-semibold text-sm uppercase tracking-widest mb-3">Tutoriales</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">
            Aprende a usar <span className="text-glow-blue text-[var(--blue)]">NEXALO</span>
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            6 guías en vídeo para dominar el ecosistema — desde conectar tu wallet hasta maximizar tus rendimientos.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VIDEOS.map((v) => {
            const c = COLOR_MAP[v.color];
            const isOpen = active === v.id;

            return (
              <div
                key={v.id}
                className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                style={{ border: `1px solid ${isOpen ? c.border : 'rgba(255,255,255,0.06)'}` }}
                onClick={() => setActive(isOpen ? null : v.id)}
              >
                {/* Thumbnail / Player area */}
                <div className="relative w-full aspect-video bg-[#05050a] flex items-center justify-center overflow-hidden">
                  {v.youtubeId ? (
                    isOpen ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0`}
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    /* Placeholder premium cuando no hay YouTube ID aún */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                      style={{ background: `radial-gradient(circle at center, ${c.glow.replace('0.4', '0.08')} 0%, transparent 70%)` }}>
                      <div className="text-5xl">{v.icon}</div>
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ background: `rgba(255,255,255,0.07)`, border: `2px solid ${c.border}` }}>
                        {/* Play icon */}
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={c.text}>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <span className="text-xs text-[var(--muted)] uppercase tracking-widest font-semibold">Próximamente</span>
                    </div>
                  )}

                  {/* Duration badge */}
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                    {v.duration}
                  </span>

                  {/* Number badge */}
                  <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                    #{v.id}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {v.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base leading-snug mb-2 group-hover:text-[var(--blue)] transition-colors">
                    {v.title}
                  </h3>
                  <p className="text-[var(--muted)] text-sm leading-relaxed">
                    {v.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA strip */}
        <div className="mt-14 glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ border: "1px solid rgba(59,130,246,0.15)" }}>
          <div>
            <p className="font-bold text-white text-lg mb-1">¿Tienes alguna duda sobre el protocolo?</p>
            <p className="text-[var(--muted)] text-sm">Usa el asistente de IA en la sección FAQ — respuestas instantáneas 24/7.</p>
          </div>
          <a
            href="#faq"
            className="shrink-0 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)", color: "white" }}
          >
            Abrir Asistente →
          </a>
        </div>
      </div>
    </section>
  );
}
