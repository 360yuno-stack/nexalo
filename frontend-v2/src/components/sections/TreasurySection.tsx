'use client';

export function TreasurySection() {
  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)]" id="tesoreria">
      <div className="max-w-[1200px] mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">Protocolos Integrados y <span className="text-glow-blue text-[var(--blue)]">Seguridad</span></h2>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto mb-16">
          NEXALO no custodia tus fondos. Operamos exclusivamente sobre contratos inteligentes inmutables y nos apoyamos en la infraestructura más robusta de Web3.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-[1000px] mx-auto text-left">
          
          <div className="glass p-8 rounded-2xl flex gap-6 items-start">
            <div className="w-16 h-16 shrink-0 rounded-full bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-2xl font-bold text-[var(--blue)]">
              C
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Chainlink VRF</h3>
              <p className="text-[var(--muted)] text-sm mb-4">
                La aleatoriedad para la selección de ganadores es generada off-chain y verificada criptográficamente on-chain. Es matemáticamente imposible manipular los resultados.
              </p>
              <a href="#" className="text-[var(--blue)] text-sm font-bold hover:underline">Ver Documentación ↗</a>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl flex gap-6 items-start">
            <div className="w-16 h-16 shrink-0 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center text-2xl font-bold text-[var(--emerald)]">
              BSC
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Binance Smart Chain</h3>
              <p className="text-[var(--muted)] text-sm mb-4">
                Desplegado en BSC para garantizar comisiones ultra bajas y tiempos de bloque de 3 segundos, permitiendo micro-transacciones eficientes y rápidas.
              </p>
              <a href="#" className="text-[var(--emerald)] text-sm font-bold hover:underline">Ver Explorador ↗</a>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl flex gap-6 items-start">
            <div className="w-16 h-16 shrink-0 rounded-full bg-[rgba(167,139,250,0.1)] border border-[rgba(167,139,250,0.3)] flex items-center justify-center text-2xl font-bold text-[#A78BFA]">
              A
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Aave Protocol (Pronto)</h3>
              <p className="text-[var(--muted)] text-sm mb-4">
                La liquidez no distribuida se inyectará automáticamente en Aave para generar yield constante y libre de riesgo mientras espera ser distribuida.
              </p>
              <span className="text-xs px-2 py-1 bg-[rgba(167,139,250,0.2)] text-[#A78BFA] rounded-md font-bold uppercase">En Desarrollo</span>
            </div>
          </div>

          <div className="glass p-8 rounded-2xl flex gap-6 items-start">
            <div className="w-16 h-16 shrink-0 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center text-2xl font-bold text-[var(--gold)]">
              🔒
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Auditoría de Código</h3>
              <p className="text-[var(--muted)] text-sm mb-4">
                El core del protocolo NexumManager.sol y las librerías matemáticas han sido exhaustivamente testeadas contra reentrancy y front-running.
              </p>
              <a href="#" className="text-[var(--gold)] text-sm font-bold hover:underline">Ver Reporte CertiK ↗</a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
