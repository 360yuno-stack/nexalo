import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Technical Documentation — NEXALO Protocol',
  description: 'Arquitectura técnica, contratos inteligentes, seguridad y guía de integración del protocolo NEXALO. Documentación completa para desarrolladores y auditores.',
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#080B12] text-gray-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#080B12]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            ← Volver al protocolo
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/whitepaper" className="text-slate-400 hover:text-blue-400 transition-colors text-sm">
              Whitepaper
            </Link>
            <span className="text-xs text-slate-600 font-mono">Docs v1.0 — Mayo 2026</span>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 py-20">

        {/* Title */}
        <header className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8 text-emerald-400 text-sm font-semibold">
            Documentación Técnica
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            NEXALO Docs
          </h1>
          <p className="text-xl text-slate-300 mb-3 font-medium">
            Arquitectura, Contratos y Seguridad del Protocolo
          </p>
          <p className="text-slate-500 text-sm">BNB Smart Chain · Solidity 0.8.20 · Auditoría Completa</p>
        </header>

        {/* Table of Contents */}
        <nav className="mb-16 p-6 rounded-xl bg-white/[0.02] border border-white/5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Índice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { n: '1', title: 'Arquitectura del Sistema', href: '#architecture' },
              { n: '2', title: 'Contratos Inteligentes', href: '#contracts' },
              { n: '3', title: 'NXLToken — Token Deflacionario', href: '#nxltoken' },
              { n: '4', title: 'NexumManager — Core de Lotería', href: '#nexummanager' },
              { n: '5', title: 'Sistema de Distribución', href: '#distribution' },
              { n: '6', title: 'Chainlink VRF — Aleatoriedad', href: '#vrf' },
              { n: '7', title: 'Sistema de Referidos', href: '#referrals' },
              { n: '8', title: 'Tesorería Bitcoin (TreasuryBTC)', href: '#treasury' },
              { n: '9', title: 'Staking y DeFi Strategies', href: '#staking' },
              { n: '10', title: 'Seguridad y Auditoría', href: '#security' },
              { n: '11', title: 'Pipeline de Seguridad', href: '#pipeline' },
              { n: '12', title: 'Guía de Integración', href: '#integration' },
            ].map(item => (
              <a key={item.n} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">{item.n}</span>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.title}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Body */}
        <div className="prose-nexalo space-y-16">

          {/* 1. Architecture */}
          <Section id="architecture" title="1. Arquitectura del Sistema">
            <P>NEXALO es un ecosistema de 8 contratos inteligentes interconectados desplegados en BNB Smart Chain (BSC). Todos los contratos están compilados con Solidity 0.8.20 usando la opción <Code>via-ir</Code> y el optimizador a 200 runs.</P>

            <div className="my-6 p-5 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-sm">
              <div className="text-slate-400 mb-3">// Diagrama de Arquitectura</div>
              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">{`
┌─────────────────────────────────────────────────┐
│                  NexumManager                    │
│         (Core — VRFConsumerBaseV2)               │
│  ┌─────────┬──────────┬──────────┬────────────┐  │
│  │ Products│ Rounds   │ VRF     │ Settlement │  │
│  │ (6)     │ (state)  │ (rand)  │ (auto)     │  │
│  └────┬────┴────┬─────┴────┬────┴─────┬──────┘  │
└───────┼─────────┼──────────┼──────────┼──────────┘
        │         │          │          │
   ┌────▼───┐ ┌──▼─────┐ ┌─▼──────┐ ┌─▼──────────┐
   │NXLToken│ │Referral│ │Treasury│ │Ambassador  │
   │(ERC20) │ │Network │ │  BTC   │ │ Registry   │
   └────────┘ └────────┘ └────────┘ └────────────┘
        │                    │
   ┌────▼───┐           ┌───▼────┐
   │Staking │           │Buyback │
   │(WBTC)  │           │Contract│
   └────────┘           └────────┘
              `}</pre>
            </div>

            <P>Cada contrato tiene una responsabilidad única (Single Responsibility Principle) y se comunica con los demás a través de interfaces definidas. El <Code>NexumManager</Code> es el hub central que orquesta la lógica de lotería, distribución de fondos y settlement.</P>
          </Section>

          {/* 2. Contracts */}
          <Section id="contracts" title="2. Contratos Inteligentes">
            <P>Todos los contratos heredan de OpenZeppelin v5 y siguen las mejores prácticas de seguridad:</P>

            <div className="my-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Contrato</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Herencia</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Función</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ['NXLToken', 'ERC20, Ownable2Step', 'Token deflacionario con rewards pool'],
                    ['NexumManager', 'VRFConsumerBaseV2, Ownable2Step, ReentrancyGuard', 'Core de lotería, 6 productos, settlement'],
                    ['ReferralNetwork', 'Ownable2Step, ReentrancyGuard', 'Referidos multinivel (3 niveles)'],
                    ['TreasuryBTC', 'Ownable2Step, ReentrancyGuard', 'Tesorería DAO en WBTC'],
                    ['AmbassadorRegistry', 'Ownable2Step, ReentrancyGuard', 'Registro y pago de embajadores'],
                    ['BuybackContract', 'Ownable2Step, ReentrancyGuard', 'Recompra automática de NXL'],
                    ['NexaloStaking', 'Ownable2Step, ReentrancyGuard', 'Staking NXL con rewards WBTC'],
                    ['DonationVault', 'Ownable2Step', 'Vault de donaciones e impacto social'],
                  ].map(([name, inh, func]) => (
                    <tr key={name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-emerald-300">{name}</td>
                      <td className="py-3 px-4 text-xs">{inh}</td>
                      <td className="py-3 px-4">{func}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 3. NXLToken */}
          <Section id="nxltoken" title="3. NXLToken — Token Deflacionario">
            <P>NXLToken es un ERC-20 con supply fijo de <Strong>100,000,000 NXL</Strong> y mecanismos de vesting integrados.</P>

            <SubSection title="Distribución Inicial">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
                <StatCard label="Rewards Pool" value="96M NXL" pct="96%" color="emerald" />
                <StatCard label="Fundador (2Y vesting)" value="3M NXL" pct="3%" color="blue" />
                <StatCard label="Partner (1Y vesting)" value="1M NXL" pct="1%" color="purple" />
              </div>
            </SubSection>

            <SubSection title="Funciones Clave">
              <CodeBlock>{`// Solo NexumManager puede distribuir rewards
function distributeReward(address to, uint256 amount) external onlyNexumManager

// setNexumManager solo se puede llamar UNA vez
function setNexumManager(address _mgr) external onlyOwner

// Vesting lineal con cliff
function claimFounderVesting() external  // Solo founder, lineal 2 años
function claimPartnerVesting() external  // Solo partner, lineal 1 año

// Checkpoints para snapshot de balances (votación/DAO futuro)
function _afterTokenTransfer() // actualiza checkpoints automáticamente`}</CodeBlock>
            </SubSection>

            <SubSection title="Propiedades Formalmente Verificadas (Halmos)">
              <div className="space-y-2 my-4">
                {[
                  'distributeReward solo puede ser llamado por NexumManager',
                  'distributeReward nunca incrementa el totalSupply',
                  'setNexumManager solo puede llamarse una vez',
                  'transfer preserva el totalSupply',
                ].map((prop, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <span className="text-sm text-slate-300">{prop}</span>
                    <span className="ml-auto text-xs text-emerald-500 font-mono">PROVEN ∀ inputs</span>
                  </div>
                ))}
              </div>
            </SubSection>
          </Section>

          {/* 4. NexumManager */}
          <Section id="nexummanager" title="4. NexumManager — Core de Lotería">
            <P>El contrato más complejo del ecosistema. Gestiona 6 productos de lotería con rondas independientes, cada uno con su propio pool de premios y configuración de tickets.</P>

            <SubSection title="Productos (Nexums)">
              <div className="my-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-slate-400">ID</th>
                      <th className="text-left py-2 px-3 text-slate-400">Nombre</th>
                      <th className="text-right py-2 px-3 text-slate-400">Precio</th>
                      <th className="text-right py-2 px-3 text-slate-400">Tickets</th>
                      <th className="text-right py-2 px-3 text-slate-400">Jackpot</th>
                      <th className="text-right py-2 px-3 text-slate-400">NXL/ticket</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 font-mono">
                    {[
                      [0, '⚡ FLASH', '$1', '1,000', '$500', '0.10'],
                      [1, '🎯 ORIGINAL', '$1', '10,000', '$5,000', '0.25'],
                      [2, '💎 PREMIUM', '$20', '1,000', '$10,000', '0.50'],
                      [3, '🚀 ELITE', '$10', '10,000', '$50,000', '0.55'],
                      [4, '👑 VIP', '$200', '1,000', '$100,000', '0.85'],
                      [5, '🌟 BLACKBLOK', '$200', '10,000', '$1,000,000', '1.00'],
                    ].map(([id, name, price, tickets, jackpot, nxl]) => (
                      <tr key={String(id)} className="border-b border-white/5">
                        <td className="py-2 px-3 text-emerald-400">{id}</td>
                        <td className="py-2 px-3 text-white font-sans">{name}</td>
                        <td className="py-2 px-3 text-right">{price}</td>
                        <td className="py-2 px-3 text-right">{tickets}</td>
                        <td className="py-2 px-3 text-right text-yellow-300">{jackpot}</td>
                        <td className="py-2 px-3 text-right text-blue-300">{nxl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection title="Ciclo de Vida de una Ronda">
              <CodeBlock>{`1. OPEN       → Usuarios compran tickets (buyTickets)
2. FUNDED     → Liquidez completa, se solicita VRF
3. VRF_SENT   → Esperando número aleatorio de Chainlink
4. SETTLING   → Distribuyendo premios (settlement en chunks)
5. SETTLED    → Ronda cerrada, nueva ronda abre automáticamente

// Función principal de compra
function buyTickets(
    uint256 productId,     // 0-5
    uint256[] ticketNums,  // números elegidos
    address referrer       // address(0) si sin referido
) external nonReentrant`}</CodeBlock>
            </SubSection>
          </Section>

          {/* 5. Distribution */}
          <Section id="distribution" title="5. Sistema de Distribución Automática">
            <P>Cuando una ronda se completa, el 100% de los fondos se distribuye automáticamente según reglas fijas e inmutables:</P>

            <div className="my-6 space-y-2">
              {[
                { label: 'Jackpot al Ganador', pct: 50, color: 'bg-yellow-400' },
                { label: 'Airdrops Instantáneos (10 winners)', pct: 10, color: 'bg-emerald-400' },
                { label: 'Treasury BTC (DAO)', pct: 10, color: 'bg-orange-400' },
                { label: 'Referidos Multinivel', pct: 10, color: 'bg-blue-400' },
                { label: 'Operaciones Fundador', pct: 7, color: 'bg-slate-400' },
                { label: 'Embajadores', pct: 5, color: 'bg-purple-400' },
                { label: 'Inversor / Partner', pct: 4, color: 'bg-pink-400' },
                { label: 'Buyback NXL + Audit + Ops', pct: 4, color: 'bg-cyan-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-20 text-right text-sm font-mono text-slate-400">{item.pct}%</div>
                  <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <div className="w-56 text-sm text-slate-300">{item.label}</div>
                </div>
              ))}
            </div>

            <P>La distribución es atómica — ocurre en la misma transacción que el settlement. No hay intermediarios, delays, ni custodia manual de fondos.</P>
          </Section>

          {/* 6. VRF */}
          <Section id="vrf" title="6. Chainlink VRF — Aleatoriedad Verificable">
            <P>NEXALO utiliza <Strong>Chainlink VRF v2</Strong> para generar números aleatorios criptográficamente verificables. Esto garantiza que nadie — ni el equipo, ni los mineros, ni Chainlink — puede predecir o manipular el resultado.</P>

            <CodeBlock>{`// Solicitud VRF (automática cuando ronda completa)
function requestRandomWords() internal {
    VRFCoordinatorV2Interface(vrfCoordinator)
        .requestRandomWords(
            keyHash,          // BSC VRF key
            subscriptionId,   // Chainlink subscription
            3,                // confirmaciones
            500000,           // gas limit callback
            1                 // 1 palabra aleatoria
        );
}

// Callback de Chainlink (solo el Coordinator puede llamar)
function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
) internal override {
    // Selección de ganador: randomWord % totalTickets
    // Settlement automático
}`}</CodeBlock>

            <P>El timeout VRF protege contra fallos del oráculo: si Chainlink no responde en el tiempo configurado, el owner puede re-solicitar o manejar la ronda. Tras <Code>finalizeAutonomy()</Code>, esta protección opera sin intervención.</P>
          </Section>

          {/* 7. Referrals */}
          <Section id="referrals" title="7. Sistema de Referidos (ReferralNetwork)">
            <P>Sistema de referidos de 3 niveles con protecciones anti-gaming:</P>

            <div className="my-4 grid grid-cols-3 gap-3">
              <StatCard label="Nivel 1 (Directo)" value="5%" pct="de la compra" color="blue" />
              <StatCard label="Nivel 2" value="3%" pct="del referido del referido" color="purple" />
              <StatCard label="Nivel 3" value="2%" pct="tercer nivel" color="pink" />
            </div>

            <P>Protecciones integradas: anti-ciclos (A→B→C→A no permitido), un solo referrer por usuario, validación de zero address, y pagos automáticos en USDT en el mismo bloque de la compra.</P>
          </Section>

          {/* 8. Treasury */}
          <Section id="treasury" title="8. Tesorería Bitcoin (TreasuryBTC)">
            <P>El 10% de cada ticket alimenta un fondo DAO que acumula USDT para convertir en WBTC. Los holders de NXL pueden redimir sus tokens por WBTC proporcionalmente durante ventanas de redención anuales.</P>

            <CodeBlock>{`// Estrategias DeFi integradas
interface IYieldStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function totalDeposited() view returns (uint256);
    function harvest() external returns (uint256);
}

// Implementaciones:
// - AaveStrategy: Lending en Aave v3
// - VenusStrategy: Lending en Venus Protocol`}</CodeBlock>
          </Section>

          {/* 9. Staking */}
          <Section id="staking" title="9. NexaloStaking">
            <P>Los usuarios pueden hacer stake de NXL y recibir rendimientos en WBTC provenientes de la tesorería. El contrato usa <Code>ReentrancyGuard</Code> y <Code>Ownable2Step</Code> para máxima seguridad.</P>
          </Section>

          {/* 10. Security */}
          <Section id="security" title="10. Seguridad y Auditoría">
            <P>El protocolo ha pasado por un pipeline de seguridad exhaustivo con 6 herramientas profesionales:</P>

            <div className="my-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-400">Herramienta</th>
                    <th className="text-left py-3 px-4 text-slate-400">Tipo</th>
                    <th className="text-left py-3 px-4 text-slate-400">Resultado</th>
                    <th className="text-right py-3 px-4 text-slate-400">Ejecuciones</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    ['Slither', 'Análisis Estático', '0 exploitables', '201 checks'],
                    ['Hardhat', 'Unit Tests', '88/88 pass', '88'],
                    ['Foundry', 'Fuzz Testing', '19/19 × 1,000 iter', '19,000'],
                    ['Echidna', 'Property Fuzzing', '5/5 holding', '100,201'],
                    ['Mythril', 'Symbolic Execution', '7/7 contracts, 0 issues', '7'],
                    ['Halmos', 'Formal Verification', '4/4 proven ∀ inputs', '∞'],
                  ].map(([tool, type, result, execs]) => (
                    <tr key={tool} className="border-b border-white/5">
                      <td className="py-3 px-4 font-mono text-emerald-300">{tool}</td>
                      <td className="py-3 px-4">{type}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">{execs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 11. Security Pipeline */}
          <Section id="pipeline" title="11. Medidas de Seguridad Implementadas">
            <div className="space-y-3 my-4">
              {[
                ['Ownable2Step', 'Transferencia de ownership en 2 pasos (proponer + aceptar) en todos los contratos'],
                ['ReentrancyGuard', 'Protección contra reentrancy en todas las funciones que mueven fondos'],
                ['nonReentrant first', 'Modificador nonReentrant siempre como primer modificador en la cadena'],
                ['Pragma pinned', 'pragma solidity 0.8.20 (sin rangos) para reproducibilidad exacta'],
                ['SafeERC20', 'Uso de SafeERC20 para todas las transferencias de tokens'],
                ['Zero address checks', 'Validación de address(0) en constructores y setters'],
                ['Events indexados', 'Todos los eventos con parámetros indexados para trazabilidad'],
                ['VRF Timeout', 'Protección contra fallos del oráculo Chainlink con timeout configurable'],
                ['finalizeAutonomy()', 'Función irreversible que renuncia a todo control administrativo'],
              ].map(([name, desc]) => (
                <div key={name} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-emerald-400 mt-0.5 text-sm">🛡️</span>
                  <div>
                    <span className="font-mono text-emerald-300 text-sm">{name}</span>
                    <span className="text-slate-400 text-sm ml-2">— {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 12. Integration */}
          <Section id="integration" title="12. Guía de Integración">
            <P>Para interactuar con el protocolo desde tu dApp o script:</P>

            <SubSection title="Instalar dependencias">
              <CodeBlock>{`npm install ethers@6 wagmi viem @reown/appkit`}</CodeBlock>
            </SubSection>

            <SubSection title="Comprar tickets">
              <CodeBlock>{`import { parseUnits } from 'viem';

// 1. Approve USDT para NexumManager
await usdtContract.write.approve([
  NEXUM_MANAGER_ADDRESS,
  parseUnits('10', 18)  // 10 USDT
]);

// 2. Comprar tickets
await nexumManager.write.buyTickets([
  0,                    // productId: FLASH
  [42, 100, 777],       // ticket numbers
  referrerAddress       // o address(0) si no hay referido
]);`}</CodeBlock>
            </SubSection>

            <SubSection title="Consultar estado de ronda">
              <CodeBlock>{`// Obtener información de ronda actual
const round = await nexumManager.read.getCurrentRound([productId]);
// Returns: { roundId, ticketsSold, totalFunded, status, winner, ... }

// Verificar si un ticket ganó
const isWinner = await nexumManager.read.isWinner([
  productId, roundId, ticketNumber
]);`}</CodeBlock>
            </SubSection>

            <SubSection title="Claim de premios">
              <CodeBlock>{`// El ganador reclama su premio
await nexumManager.write.claimPrize([productId, roundId]);

// Verificar balance de premios pendientes
const pending = await nexumManager.read.getPendingPrize([
  userAddress, productId, roundId
]);`}</CodeBlock>
            </SubSection>
          </Section>

        </div>

        {/* Footer */}
        <footer className="mt-24 pt-10 border-t border-white/5 text-center space-y-4">
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            Esta documentación es técnica y no constituye asesoramiento financiero ni legal.
            El código fuente está disponible en GitHub y verificable en BSCScan.
          </p>
          <div className="flex justify-center gap-8">
            <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
              ← Volver al Protocolo
            </Link>
            <Link href="/whitepaper" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Whitepaper →
            </Link>
            <a href="https://github.com/360yuno-stack/nexalo" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm transition-colors">
              GitHub →
            </a>
          </div>
        </footer>

      </article>
    </main>
  );
}

/* ── Reusable Components ───────────────────────────────── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold text-white mb-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 leading-relaxed text-[1.05rem]">{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-white font-semibold">{children}</strong>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-white/5 px-1.5 py-0.5 rounded text-emerald-300 text-sm font-mono">{children}</code>;
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-4 p-4 rounded-xl bg-[#0d1117] border border-white/5 overflow-x-auto">
      <code className="text-sm text-slate-300 font-mono leading-relaxed">{children}</code>
    </pre>
  );
}

function StatCard({ label, value, pct, color }: { label: string; value: string; pct: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
  };
  return (
    <div className={`rounded-xl p-4 border ${colorMap[color] || colorMap.emerald}`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 text-slate-500">{pct}</div>
    </div>
  );
}
