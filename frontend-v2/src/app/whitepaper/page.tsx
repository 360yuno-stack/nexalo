import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Whitepaper — NEXALO Protocol',
  description: 'Qué es NEXALO, por qué existe y por qué puedes confiar en él. Documentación completa del protocolo DeFi autónomo de lotería en BNB Smart Chain.',
};

export default function WhitepaperPage() {
  return (
    <main className="min-h-screen bg-[#080B12] text-gray-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#080B12]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            ← Volver al protocolo
          </Link>
          <span className="text-xs text-slate-600 font-mono">Whitepaper v1.0 — Mayo 2026</span>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-20">

        {/* Title */}
        <header className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8 text-blue-400 text-sm font-semibold">
            Documentación Oficial del Protocolo
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            NEXALO
          </h1>
          <p className="text-xl text-slate-300 mb-3 font-medium">
            El Primer Protocolo de Lotería DeFi Completamente Autónomo
          </p>
          <p className="text-slate-500 text-sm">BNB Smart Chain · Versión 1.0 · Mayo 2026</p>
        </header>

        {/* Body */}
        <div className="prose-nexalo space-y-16">

          <Section title="El Problema: Por Qué las Loterías Tradicionales Están Rotas">
            <P>Las loterías son el juego de azar más antiguo de la humanidad. Cada año, el mundo gasta más de 350 mil millones de dólares en ellas. Sin embargo, la enorme mayoría de ese dinero no regresa a los jugadores — lo absorbe el estado, la empresa operadora, los intermediarios y los costes administrativos. En la lotería nacional promedio, el jugador recupera entre el 40% y el 55% del dinero apostado en forma de premios. El resto desaparece en una caja negra.</P>
            <P>El problema no es solo económico. Es de confianza. ¿Cómo sabes que el número ganador no estaba elegido de antemano? ¿Cómo verificas que el premio realmente existe? ¿A quién reclamas si el sistema falla? En las loterías centralizadas, la respuesta a estas preguntas es siempre la misma: confía en nosotros.</P>
            <P>NEXALO nació para eliminar esa necesidad de confianza. No mejorando el sistema existente — sino reemplazándolo por completo con código que cualquiera puede leer, verificar y auditar.</P>
          </Section>

          <Section title="La Solución: Un Contrato Inteligente Que Es La Única Autoridad">
            <P>NEXALO es un protocolo de lotería que vive en BNB Smart Chain, una blockchain pública. Sus reglas están escritas en código Solidity y publicadas permanentemente en la red. No hay un servidor central que se pueda apagar. No hay un administrador que pueda cambiar las probabilidades. No hay una empresa que pueda quedarse con los fondos.</P>
            <P>Cuando alguien compra un ticket en NEXALO, su USDT va directamente al smart contract. El contrato — de forma automática, en el mismo bloque de la transacción — divide ese dinero según reglas fijas e inmutables: el 50% al premio, el 10% al sistema de inversores, el 10% a staking y rendimiento en Bitcoin, el 10% a los referidos, el 5% a embajadores, y el 15% a operaciones. Esto sucede sin que ningún humano toque un botón.</P>
            <P>El ganador se selecciona mediante Chainlink VRF — una tecnología de oráculo que genera números aleatorios con pruebas criptográficas verificables. Esto significa que cualquier persona, en cualquier momento, puede verificar matemáticamente que el número ganador fue generado de forma justa. No por NEXALO. No por Chainlink. Sino por la matemática.</P>
          </Section>

          <Section title="Cómo Funciona: El Ciclo Completo">
            <P>NEXALO ofrece seis niveles de participación llamados Nexums — desde tickets de $1 USDT hasta tickets de $200 USDT, con premios que van desde $500 hasta $1,000,000 de dólares. Cada Nexum es una ronda independiente con su propio pool de premios.</P>
            <P>El proceso es simple: un usuario conecta su wallet de criptomonedas, elige un Nexum, selecciona sus números y confirma la transacción. En ese instante, su USDT se distribuye automáticamente. Recibe tokens NXL como recompensa por participar. Y queda registrado en la blockchain como propietario de esos números para esa ronda.</P>
            <P>Cuando todos los tickets de una ronda se venden, el contrato solicita automáticamente un número aleatorio a Chainlink. Segundos después, el ganador queda registrado on-chain. Su premio está acreditado en su saldo, listo para reclamar con un solo clic — en cualquier momento, sin fecha de caducidad. El dinero no va a ningún lado: está en el contrato, esperando al ganador, para siempre si es necesario.</P>
          </Section>

          <Section title="Por Qué Puedes Confiar: La Autonomía Como Garantía">
            <P>La pregunta más razonable que puede hacer un escéptico es: ¿y si el equipo de NEXALO decide un día cambiar las reglas, pausar el contrato o llevarse los fondos?</P>
            <P>La respuesta está en el código: no pueden. El protocolo tiene una función llamada <code className="bg-white/5 px-1.5 py-0.5 rounded text-blue-300 text-sm font-mono">finalizeAutonomy()</code> que, cuando se ejecuta, renuncia permanentemente a todo control administrativo. Tras su activación, nadie en el mundo — ni el equipo fundador, ni ningún contrato, ni ningún hacker — puede modificar la distribución de fondos, cambiar el oráculo de aleatoriedad, pausar el protocolo indefinidamente ni retirar los fondos del jackpot pool.</P>
            <P>El código es público en BSCScan. Cualquier desarrollador puede leerlo, compilarlo y verificar que hace exactamente lo que dice. Cualquier usuario puede ver cada transacción, cada distribución de fondos, cada selección de ganador. La transparencia no es una promesa — es la naturaleza física del sistema.</P>
          </Section>

          <Section title="El Ecosistema: Más Que Una Lotería">
            <P>NEXALO no es solo un sistema de premios. Es un ecosistema financiero completo construido alrededor del juego.</P>
            <P><strong className="text-white">Inversores:</strong> Cualquier persona puede proveer liquidez USDT a las rondas activas y recibir un rendimiento del 3% sobre su capital por cada ronda completada. Es un retorno fijo, predecible y verificable on-chain — sin las variables impredecibles de los mercados de criptomonedas típicos.</P>
            <P><strong className="text-white">Referidos de tres niveles:</strong> Al compartir tu enlace único, ganas el 5% directo de cada compra de tu referido. Sus referidos te dan el 3%, y los de ellos el 2%. Las comisiones se pagan en el momento exacto de la compra, automáticamente, en USDT.</P>
            <P><strong className="text-white">Tesorería Bitcoin:</strong> El 10% de cada ticket alimenta un fondo que compra Bitcoin (WBTC) en el mercado. Una vez al año, los poseedores de tokens NXL pueden intercambiar sus tokens por WBTC acumulado — creando un vínculo directo entre la actividad del protocolo y el activo digital más sólido del mundo.</P>
            <P><strong className="text-white">Token NXL:</strong> Cada compra de ticket genera automáticamente tokens NXL para el comprador, sin coste adicional. El supply máximo es de un millón de tokens — fijo, sin posibilidad de crear más. A medida que el protocolo crece y más NXL se quema en la redención por WBTC, la escasez aumenta.</P>
          </Section>

          <Section title="Ventaja Frente a los Competidores">
            <P>El mercado de loterías descentralizadas existe, pero está fragmentado e incompleto. PoolTogether, el líder actual, usa un modelo sin pérdidas donde los depósitos generan rendimiento y ese rendimiento es el premio — los jackpots son pequeños ($100-$500). PancakeSwap Lottery opera con su token propio CAKE y distribuye solo el 40% de los fondos en premios. Ninguno combina jackpots grandes, inversores, referidos, treasury de Bitcoin y token deflacionario en un solo contrato inmutable.</P>
            <P>NEXALO distribuye el 96% de cada USDT al ecosistema — la tasa más alta del mercado. El 4% restante cubre operaciones y desarrollo. Frente al 45-60% que retienen las loterías tradicionales, la diferencia es estructural.</P>
          </Section>

          <Section title="Riesgos y Limitaciones: Lo Que Necesitas Saber">
            <P>La transparencia de NEXALO no se detiene en el código — también incluye ser honestos sobre sus limitaciones. Cualquier persona que participe en el protocolo debe conocer los siguientes puntos antes de hacerlo.</P>
            <P><strong className="text-white">Código como único contrato:</strong> El smart contract es el árbitro definitivo. Aunque ha sido revisado exhaustivamente con 73 tests automatizados y una auditoría externa en proceso, ningún software es absolutamente infalible. Participar con fondos que no puedas permitirte perder es una decisión personal — no una que NEXALO pueda tomar por ti.</P>
            <P><strong className="text-white">Valor del token NXL:</strong> El precio de NXL lo determina el mercado libre, no el protocolo. Puede subir, bajar o llegar a cero en función de la oferta y la demanda. Recibir NXL al comprar tickets es una recompensa adicional — no una garantía de valor.</P>
            <P><strong className="text-white">Marco regulatorio:</strong> Las loterías descentralizadas operan en un espacio legal que evoluciona rápidamente y varía por país. En algunas jurisdicciones, el acceso puede estar restringido o sujeto a regulaciones específicas. Es responsabilidad del usuario conocer y cumplir la legislación vigente en su territorio.</P>
            <P><strong className="text-white">Obligaciones fiscales:</strong> Los premios obtenidos en NEXALO son ingresos digitales sujetos a la legislación fiscal de cada país. NEXALO es un protocolo autónomo descentralizado — no es una empresa, no está domiciliado en ninguna jurisdicción y no tiene capacidad legal ni técnica para retener impuestos, emitir declaraciones fiscales ni actuar como agente tributario. Cada usuario es el único responsable de declarar y liquidar los impuestos que correspondan en su país de residencia fiscal sobre cualquier premio, rendimiento o ganancia obtenida a través del protocolo.</P>
          </Section>

          <Section title="Responsabilidad Fiscal: El Protocolo No Retiene Impuestos">
            <P>Este punto merece su propio espacio porque afecta directamente a cualquier persona que gane un premio en NEXALO, y la claridad aquí es no negociable.</P>
            <P>Cuando el smart contract acredita un premio en el saldo de un ganador, la transacción es completamente pública y permanente en la blockchain. NEXALO no realiza ninguna retención fiscal, no emite certificados de ganancias, no notifica a ninguna autoridad tributaria y no tiene ninguna obligación legal de hacerlo — porque no es una empresa registrada. Es un protocolo de software autónomo desplegado en una red descentralizada global.</P>
            <P>Lo que esto significa en la práctica: <strong className="text-white">si ganas un premio en NEXALO, eres el único responsable de conocer las leyes fiscales de tu país y cumplir con ellas</strong>. En muchos países, los premios de lotería están sujetos a impuestos sobre la renta, ganancias de capital u otras figuras tributarias. En algunos, los activos digitales tienen un régimen fiscal específico que puede diferir del tratamiento de premios tradicionales. En otros, pueden aplicarse umbrales de declaración que no requieren pago inmediato pero sí obligación de reportar.</P>
            <P>NEXALO no puede asesorarte sobre tu situación fiscal particular. Ningún contenido de este protocolo, del whitepaper ni de la interfaz de usuario constituye asesoramiento fiscal o legal. Si tienes dudas sobre el tratamiento impositivo de tus ganancias, consulta a un asesor fiscal cualificado en tu jurisdicción antes de participar.</P>
          </Section>

          <Section title="La Frontera del Fiat: Honestidad Sobre un Límite Real">
            <P>Existe una pregunta que merece una respuesta directa: si NEXALO es autónomo, ¿cómo puede funcionar con pagos con tarjeta de crédito?</P>
            <P>La respuesta es técnicamente precisa: la conversión de dinero tradicional (euros, dólares) a criptomonedas <strong className="text-white">siempre requiere una entidad regulada por ley</strong>. En cualquier jurisdicción del mundo, transformar fiat en cripto implica cumplimiento KYC/AML — identificación del usuario, registro de la transacción, supervisión regulatoria. Esto no es una elección de diseño: es la ley.</P>
            <P>Lo que NEXALO puede garantizar es que <strong className="text-white">nunca es el intermediario de esos fondos</strong>. El flujo es el siguiente: el proveedor de pago (Transak o Moonpay) recibe el pago con tarjeta, convierte a USDT y envía esos USDT <em>directamente a la wallet del usuario</em>. NEXALO no toca, no ve, no custodia ni un solo dólar en ese proceso. Una vez el USDT llega a la wallet del usuario, desde ese momento en adelante todo es autónomo: el usuario firma la transacción al smart contract, que opera con las mismas reglas inmutables de siempre.</P>
            <P>La cadena completa es: <code className="bg-white/5 px-1.5 py-0.5 rounded text-blue-300 text-sm font-mono">Tarjeta → Transak (regulado) → Wallet del usuario → NexumManager (autónomo)</code>. NEXALO aparece solo en el último paso — y en ese paso no existe ninguna parte humana con poder sobre los fondos.</P>
          </Section>

          <Section title="La Visión: Un Protocolo Para Siempre">
            <P>La gran mayoría de los proyectos cripto dependen de un equipo que los mantenga activos. Si el equipo desaparece, el proyecto muere. NEXALO está diseñado para lo opuesto: una vez activada la autonomía, el protocolo funciona indefinidamente sin que nadie tenga que hacer nada.</P>
            <P>Las rondas se completan solas. Los ganadores reciben sus premios. Los inversores acumulan rendimientos. Los referidos cobran sus comisiones. La tesorería compra Bitcoin. Todo esto ocurre en la blockchain, bloque a bloque, mientras la red de BNB Smart Chain siga existiendo.</P>
            <P>Eso es NEXALO: no una empresa, no una promesa, no una hoja de ruta que depende de que alguien la ejecute. Es un conjunto de reglas matemáticas escritas en código, desplegadas en una red descentralizada global, que opera por su propio peso — como el Bitcoin opera por su propio peso desde 2009.</P>
          </Section>

        </div>

        {/* Footer */}
        <footer className="mt-24 pt-10 border-t border-white/5 text-center space-y-4">
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            Este documento es informativo y no constituye asesoramiento financiero, legal ni fiscal.
            Los premios obtenidos en el protocolo pueden estar sujetos a obligaciones tributarias según la legislación
            de cada país. Cada usuario es el único responsable del cumplimiento fiscal en su jurisdicción.
            NEXALO no retiene impuestos ni actúa como agente tributario en ninguna circunstancia.
          </p>
          <div className="flex justify-center gap-8">
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              ← Volver al Protocolo
            </Link>
            <Link href="/docs" className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
              Docs Técnicos →
            </Link>
            <a href="https://bscscan.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm transition-colors">
              Verificar en BSCScan →
            </a>
          </div>
        </footer>

      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 leading-relaxed text-[1.05rem]">{children}</p>;
}
