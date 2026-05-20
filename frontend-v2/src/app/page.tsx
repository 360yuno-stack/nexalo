import { Header } from '@/components/layout/Header';
import { NexumGrid } from '@/components/sections/NexumGrid';
import { TreasurySection } from '@/components/sections/TreasurySection';
import { StakingSection } from '@/components/sections/StakingSection';
import { AccountSection } from '@/components/sections/AccountSection';
import { InvestorSection } from '@/components/sections/InvestorSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { AmbassadorSection } from '@/components/sections/AmbassadorSection';
import { TokenomicsSection } from '@/components/sections/TokenomicsSection';
import { ImpactSection } from '@/components/sections/ImpactSection';
import { VideoTutorialsSection } from '@/components/sections/VideoTutorialsSection';
import { FiatPaymentSection } from '@/components/sections/FiatPaymentSection';
import { RoadmapSection } from '@/components/sections/RoadmapSection';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* HERO SECTION - REPLICA EXACTA DEL INDEX.HTML */}
      <section className="relative pt-[180px] pb-[80px] px-4 md:px-8 overflow-hidden" id="hero">
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <div className="badge-wrap mb-8">
            <img src="/nexalo-logo.png" alt="Nexalo Logo" className="nexalo-badge" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 font-display tracking-tight leading-tight">
            NEXALO <span className="text-glow-blue text-[var(--blue)]">V2</span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--blue)] font-bold mb-8 uppercase tracking-widest text-glow-blue">
            Protocolo Autónomo • 96% Retorno Real
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <div className="stat-badge"><span className="text-[var(--emerald)]">●</span> Contrato Auditado</div>
            <div className="stat-badge"><span className="text-[var(--blue)]">●</span> Fondos Bloqueados</div>
            <div className="stat-badge"><span className="text-[var(--gold)]">●</span> 100% Descentralizado</div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-6 mb-24">
            <a href="#comprar" className="btn-primary text-xl px-12 py-5 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              Entrar al Protocolo
            </a>
            <a href="https://bscscan.com" target="_blank" rel="noopener noreferrer" className="btn-outline text-xl px-12 py-5 flex items-center justify-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              Ver Contrato Inteligente
            </a>
          </div>

          {/* INFOGRAFÍA INTERACTIVA (PIXEL PERFECT) */}
          <div className="mt-20 pt-20 border-t border-[var(--border)] relative">
            <h2 className="text-3xl font-bold mb-16 font-display">¿Cómo funciona Nexalo?</h2>
            
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 max-w-[1000px] mx-auto">
              
              {/* Box 1: Compra */}
              <div className="glass p-8 rounded-2xl w-full lg:w-[30%] text-left card-hover relative z-10">
                <div className="w-12 h-12 rounded-full bg-[rgba(59,130,246,0.1)] flex items-center justify-center mb-6 border border-[rgba(59,130,246,0.3)]">
                  <span className="text-[var(--blue)] font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Adquisición de Nexums</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  Los usuarios intercambian USDT por Nexums, el activo de participación del protocolo.
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden lg:block flow-arrow"></div>

              {/* Box 2: Smart Contract & Distribución (Donut Chart) */}
              <div className="glass-blue p-8 rounded-3xl w-full lg:w-[40%] text-center card-hover transform lg:scale-110 z-20 relative shadow-[0_0_50px_rgba(59,130,246,0.15)] border-[rgba(59,130,246,0.4)]">
                <h3 className="text-xl font-bold mb-6 text-glow-blue">Smart Contract Inmutable</h3>
                
                <div className="relative w-[200px] h-[200px] mx-auto mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    
                    {/* Premios 80% */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="12"
                            strokeDasharray="251.2" strokeDashoffset="50.24" className="donut-segment" />
                    
                    {/* Referidos 16% */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="12"
                            strokeDasharray="251.2" strokeDashoffset="210.84" transform="rotate(288 50 50)" className="donut-segment" />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--blue)] drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">96%</span>
                    <span className="text-xs text-[var(--muted)] uppercase tracking-wider">Retorno Total</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-[var(--blue)] shadow-[0_0_10px_#3B82F6]"></div>
                      <span className="text-sm font-bold">80%</span>
                    </div>
                    <span className="text-xs text-[var(--muted)]">Bolsa de Premios</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-[var(--emerald)] shadow-[0_0_10px_#10B981]"></div>
                      <span className="text-sm font-bold">16%</span>
                    </div>
                    <span className="text-xs text-[var(--muted)]">Plan de Referidos</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden lg:block flow-arrow"></div>

              {/* Box 3: Chainlink VRF */}
              <div className="glass p-8 rounded-2xl w-full lg:w-[30%] text-left card-hover relative z-10">
                <div className="w-12 h-12 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 border border-[rgba(16,185,129,0.3)]">
                  <span className="text-[var(--emerald)] font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-bold mb-4">Resolución VRF</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  Chainlink provee aleatoriedad criptográfica verificable. Los premios se envían automáticamente a las wallets de los ganadores.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Main App Content */}
      <div className="relative z-10 space-y-12 pb-24">
        <div><AccountSection /></div>
        <div><NexumGrid /></div>
        <div><InvestorSection /></div>
        <div><TreasurySection /></div>
        <div><StakingSection /></div>
        <div><AmbassadorSection /></div>
        <div><TokenomicsSection /></div>
        <div><ImpactSection /></div>
        <div><VideoTutorialsSection /></div>
        <div><FiatPaymentSection /></div>
        <div><RoadmapSection /></div>
        <div><FAQSection /></div>
      </div>
    </main>
  );
}
