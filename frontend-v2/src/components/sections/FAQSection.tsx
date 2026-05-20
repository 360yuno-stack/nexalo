'use client';

import { useState, useRef, useEffect } from 'react';
import { CONFIG } from '@/lib/config';

export function FAQSection() {
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([
    { role: 'bot', text: '¡Hola! Soy el asistente de NEXALO. Puedo responder tus preguntas sobre el protocolo, cómo comprar tickets, cómo funciona el VRF, NXL tokens y más. ¿En qué puedo ayudarte?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: inputText }]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let response = "No encontré una respuesta exacta. Puedes preguntarme sobre:\n\n• Comprar tickets y elegir números\n• Premios y sorteos (Chainlink VRF)\n• Token NXL y staking\n• Inversión y pools de liquidez\n• Referidos y embajadores\n• Seguridad del protocolo";
      
      const lower = currentInput.toLowerCase();
      if (lower.includes('comprar') || lower.includes('ticket') || lower.includes('nexum')) {
        response = "1) Conecta tu wallet (MetaMask o WalletConnect). 2) Asegúrate de tener USDT en BSC Mainnet. 3) Elige un Nexum (FLASH, ORIGINAL, PREMIUM...). 4) Selecciona tus números o usa compra rápida. 5) Confirma la transacción y listo — ¡estás en la ronda!";
      } else if (lower.includes('vrf') || lower.includes('ganador') || lower.includes('aleatori') || lower.includes('sorteo')) {
        response = "El ganador se selecciona mediante Chainlink VRF (Verifiable Random Function), un oráculo de aleatoriedad criptográficamente verificable on-chain. Nadie — ni el equipo ni el contrato — puede predecir o manipular el resultado. El proceso es 100% autónomo.";
      } else if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto cuesta') || lower.includes('cuanto vale')) {
        response = "Precios por Nexum:\n\n⚡ FLASH: $1 USDT (hasta 1,000 tickets)\n🎯 ORIGINAL: $1 USDT (hasta 10,000 tickets)\n💎 PREMIUM: $20 USDT (hasta 1,000 tickets)\n🚀 ELITE: $10 USDT (hasta 10,000 tickets)\n👑 VIP: $200 USDT (hasta 1,000 tickets)\n🌟 BLACKBLOK: $200 USDT (hasta 10,000 tickets)";
      } else if (lower.includes('nxl') || lower.includes('token') || lower.includes('reward')) {
        response = "NXL es el token de utilidad y gobernanza de NEXALO. Lo recibes automáticamente al comprar tickets (sin acción extra). Usos:\n• Staking → recibe WBTC como recompensa pasiva\n• Votación en gobernanza futura\n• Acceso a productos exclusivos\n\nSupply máximo: 1 millón de NXL. Cada ticket da NXL según el producto elegido.";
      } else if (lower.includes('roi') || lower.includes('inversor') || lower.includes('liquidez') || lower.includes('invertir') || lower.includes('retorno') || lower.includes('ganancia')) {
        response = "El modelo inversor de NEXALO funciona así:\n\n• Provees USDT a una ronda activa como liquidez.\n• Recibes un 3% (PCT_INVESTOR = 300 bps) de tu capital por cada ronda completada.\n• Ej: $1,000 × 3% = $30 por ronda. En 10 rondas: $300 de ganancia ($1,300 total).\n\nEl beneficio es proporcional a tu participación en el pool de liquidez. Las ganancias reales varían con el volumen on-chain.";
      } else if (lower.includes('referido') || lower.includes('embajador') || lower.includes('comision') || lower.includes('comisión')) {
        response = "Sistema de referidos de NEXALO:\n• Nivel 1 (directo): 10% de comisión en USDT por cada compra de tu referido.\n• Nivel 2 (indirecto): 4% de comisión.\n• Nivel 3: 2% de comisión.\n\nEmbajadores: Registrados en el Ambassador Registry, reciben 5% del volumen total de la red. Las comisiones se reclaman en 'Mi Cuenta' → Referidos.";
      } else if (lower.includes('segur') || lower.includes('hack') || lower.includes('auditor') || lower.includes('vulnerab') || lower.includes('fondos seguros') || lower.includes('scam')) {
        response = "NEXALO es un protocolo autónomo e inmutable:\n\n✅ Contrato auditado y verificado en BSCScan.\n✅ Chainlink VRF para aleatoriedad infalsificable.\n✅ Fondos de premios bloqueados en el contrato — nadie puede tocarlos antes del sorteo.\n✅ Protección anti-reentrancy en todas las funciones de pago.\n✅ Renounced ownership: tras el deploy final, nadie tiene control administrativo.\n\nLos fondos solo salen hacia el ganador, referidos, inversores y treasury — según el código on-chain.";
      } else if (lower.includes('staking') || lower.includes('wbtc') || lower.includes('bitcoin')) {
        response = "El staking de NXL funciona así:\n1) Tienes tokens NXL (los ganas comprando tickets).\n2) Haz staking en la sección 'Staking'.\n3) Recibes WBTC (Bitcoin tokenizado) como recompensa pasiva.\n\nLas recompensas provienen del 10% del volumen de tickets que va al Treasury BTC, que adquiere WBTC y lo distribuye entre los stakers proporcional a su stake.";
      } else if (lower.includes('no reclam') || lower.includes('expira') || lower.includes('caduca') || lower.includes('tiempo limite') || lower.includes('vence') || lower.includes('no cobro') || lower.includes('olvid') || lower.includes('recuperar premio')) {
        response = "No hay ningún tiempo límite para reclamar tu premio. Tu saldo permanece almacenado de forma segura e indefinida en el smart contract.\n\n¿Olvidaste reclamar? Pasos:\n1) Conecta la misma wallet con la que compraste los tickets.\n2) Ve a 'Mi Cuenta' → 'USDT Reclamable'.\n3) Haz clic en 'Reclamar USDT'.\n4) Confirma la transacción en tu wallet.\n\nSolo TÚ puedes ejecutar claimStable(). Tu premio nunca desaparece ni caduca.";
      } else if (lower.includes('retir') || lower.includes('withdraw') || lower.includes('sacar') || lower.includes('cobrar')) {
        response = "Para retirar tus ganancias:\n\n• USDT (premios/comisiones): Ve a 'Mi Cuenta' → 'Reclamar USDT'.\n• NXL (rewards de tickets): Ve a 'Mi Cuenta' → 'Reclamar NXL'.\n• WBTC (staking rewards): Ve a 'Staking' → 'Reclamar WBTC'.\n\nCada retiro es una transacción directa al smart contract. Solo pagas el gas de BSC (~$0.10-$0.30 aproximadamente). No hay comisiones de plataforma.";
      } else if (lower.includes('smart contract') || lower.includes('contrato') || lower.includes('bscscan') || lower.includes('verificado')) {
        response = "El contrato principal es NexumManager, desplegado en BSC Mainnet y verificado en BSCScan (código fuente público). Todas las funciones son públicas y auditables:\n\n• buySpecificTickets() — compra tickets\n• claimStable() — reclama premios en USDT\n• claimNXL() — reclama tokens NXL\n• provideLiquidity() — invierte como LP\n• finalizeAutonomy() — renounce de ownership\n\nPuedes verificar cada transacción en tiempo real en bscscan.com.";
      }
      
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <section id="faq" className="py-20 px-6 relative z-10 bg-[#080B12]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[var(--color-primary)] font-semibold text-sm uppercase tracking-widest mb-3">Soporte</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Preguntas Frecuentes</h2>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
            ¿Tienes dudas? Escríbenos directamente o consulta a nuestro Bot Autónomo.
          </p>
        </div>

        {/* Chat */}
        <div className="glass-card rounded-2xl overflow-hidden border border-[var(--color-border-glow)]">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent">
            <div className="w-3 h-3 rounded-full bg-[var(--color-success)] animate-pulse"></div>
            <span className="font-bold text-white text-sm">NEXALO ASSISTANT</span>
            <span className="ml-auto text-xs text-[var(--color-text-secondary)]">Respuestas instantáneas</span>
          </div>

          <div ref={chatRef} className="h-80 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
                    🤖
                  </div>
                )}
                <div className={`${msg.role === 'bot' ? 'bg-[var(--color-primary)]/10 rounded-tl-none border-[var(--color-primary)]/20' : 'bg-white/5 rounded-tr-none border-white/10'} border rounded-2xl px-4 py-3 max-w-[80%]`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-[0.65rem] opacity-50 mt-1">{msg.role === 'bot' ? 'NEXALO Bot' : 'Tú'}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-sm">
                    👤
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-2xl rounded-tl-none px-4 py-3">
                  <span className="inline-flex gap-1 items-center h-full">
                    <span className="w-2 h-2 bg-[var(--color-primary)]/60 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-[var(--color-primary)]/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-[var(--color-primary)]/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 pt-2">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu pregunta..." 
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors"
              />
              <button 
                onClick={handleSend}
                className="bg-[var(--color-primary)] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                ENVIAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
