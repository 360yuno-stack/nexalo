'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAmbassadorInfo, useSelfRegisterAmbassador, useClaimAmbassadorRewards } from '@/hooks/useNexaloProtocol';
import { TransactionButton } from '@/components/TransactionButton';
import { CONFIG } from '@/lib/config';
import { formatUnits } from 'viem';

export function AmbassadorSection() {
  const { address, isConnected } = useAccount();
  const { isApproved, isRegistered, isActive, pendingRewards, totalClaimed } = useAmbassadorInfo();
  const { register } = useSelfRegisterAmbassador();
  const { claim } = useClaimAmbassadorRewards();
  const [ambassadorName, setAmbassadorName] = useState('');

  const refLink = isConnected && address 
    ? `https://nexalo.app/?ref=${address}`
    : "Conecta tu wallet para generar enlace";

  const formattedPending = pendingRewards ? formatUnits(pendingRewards, 18) : '0.00';
  const formattedClaimed = totalClaimed ? formatUnits(totalClaimed, 18) : '0.00';

  const handleRegister = async () => {
    if (!ambassadorName || ambassadorName.length < 2) throw new Error("Nombre inválido (mínimo 2 caracteres)");
    return await register(ambassadorName);
  };

  const handleClaim = async () => {
    return await claim();
  };

  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden" id="embajadores">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--emerald)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">Programa de <span className="text-glow-green text-[var(--emerald)]">Embajadores</span></h2>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto mb-16">
          Gana comisiones directas e indirectas por expandir la red descentralizada. Sistema Unilevel automatizado pagado instantáneamente por el Smart Contract.
        </p>

        {/* Commission Levels — CORRECTED to match contract reality (3 levels, 50/30/20 of 10% budget) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Nivel 1 — 5% of ticket price */}
          <div className="glass-emerald p-6 rounded-2xl card-hover relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-6xl opacity-10 font-bold italic">1</div>
            <span className="text-[var(--emerald)] font-bold text-sm block mb-2 tracking-widest uppercase">Nivel 1 — Directo</span>
            <div className="text-4xl font-mono font-bold mb-2">5%</div>
            <p className="text-sm text-[var(--muted)]">Invitados directos (50% del budget referral)</p>
          </div>
          
          {/* Nivel 2 — 3% of ticket price */}
          <div className="glass p-6 rounded-2xl card-hover relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-6xl opacity-10 font-bold italic">2</div>
            <span className="text-[var(--muted)] font-bold text-sm block mb-2 tracking-widest uppercase">Nivel 2</span>
            <div className="text-4xl font-mono font-bold mb-2">3%</div>
            <p className="text-sm text-[var(--muted)]">Referidos de tu nivel 1 (30% del budget referral)</p>
          </div>
          
          {/* Nivel 3 — 2% of ticket price */}
          <div className="glass p-6 rounded-2xl card-hover relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-6xl opacity-10 font-bold italic">3</div>
            <span className="text-[var(--muted)] font-bold text-sm block mb-2 tracking-widest uppercase">Nivel 3</span>
            <div className="text-4xl font-mono font-bold mb-2">2%</div>
            <p className="text-sm text-[var(--muted)]">Referidos de tu nivel 2 (20% del budget referral)</p>
          </div>
        </div>

        {/* Ambassador Registration / Status */}
        {isConnected && !isRegistered && (
          <div className="max-w-[600px] mx-auto glass p-8 rounded-2xl border border-[rgba(16,185,129,0.2)] mb-8">
            {isApproved ? (
              <div>
                <h3 className="text-lg font-bold mb-4 text-[var(--emerald)]">✅ Pre-aprobado para registro</h3>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Tu nombre de embajador"
                    value={ambassadorName}
                    onChange={(e) => setAmbassadorName(e.target.value)}
                    maxLength={64}
                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[var(--emerald)] transition-colors"
                  />
                </div>
                <TransactionButton
                  onClick={handleRegister}
                  chainIdRequired={CONFIG.NETWORK.chainId}
                  successMessage="¡Registro como embajador completado!"
                >
                  <span className="w-full btn-primary block text-center py-3">Registrarme como Embajador</span>
                </TransactionButton>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2 text-[var(--muted)]">Solicitar aprobación</h3>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Necesitas ser pre-aprobado por el equipo antes de registrarte como embajador.
                </p>
                <a href="mailto:ambassadors@nexalo.app" className="btn-outline inline-block px-6 py-3 text-sm">
                  Solicitar Aprobación
                </a>
              </div>
            )}
          </div>
        )}

        {/* Ambassador Stats (if registered) */}
        {isRegistered && (
          <div className="max-w-[600px] mx-auto glass p-6 rounded-2xl border border-[rgba(16,185,129,0.3)] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-[var(--muted)]">Estatus</span>
              <div className={`font-bold ${isActive ? 'text-[var(--emerald)]' : 'text-red-400'}`}>
                {isActive ? '● Activo' : '● Inactivo'}
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs text-[var(--muted)]">Pendiente</span>
              <div className="text-xl font-mono font-bold text-[var(--emerald)]">{parseFloat(formattedPending).toFixed(2)} USDT</div>
            </div>
            <div className="text-center">
              <span className="text-xs text-[var(--muted)]">Total Reclamado</span>
              <div className="text-xl font-mono font-bold">{parseFloat(formattedClaimed).toFixed(2)} USDT</div>
            </div>
            {pendingRewards && pendingRewards > 0n && (
              <TransactionButton
                onClick={handleClaim}
                chainIdRequired={CONFIG.NETWORK.chainId}
                successMessage="Comisiones de embajador reclamadas."
              >
                <span className="btn-primary px-4 py-2 text-sm">Reclamar</span>
              </TransactionButton>
            )}
          </div>
        )}

        {/* Refer Link Gen */}
        <div className="max-w-[800px] mx-auto glass p-8 rounded-2xl border border-[var(--emerald)] shadow-[0_0_40px_rgba(16,185,129,0.1)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left w-full">
            <span className="text-sm font-bold text-[var(--emerald)] mb-2 block uppercase tracking-widest">Tu Enlace de Referido</span>
            <div className="flex bg-[rgba(0,0,0,0.4)] rounded-xl border border-[var(--border)] overflow-hidden w-full">
              <input 
                type="text" 
                readOnly 
                value={refLink} 
                className="bg-transparent px-4 py-3 text-sm text-[var(--muted)] w-full outline-none font-mono" 
              />
              <button 
                className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] px-6 text-sm font-bold border-l border-[var(--border)] transition-colors"
                onClick={() => isConnected ? navigator.clipboard.writeText(refLink) : null}
              >
                Copiar
              </button>
            </div>
          </div>
          <div className="shrink-0 text-center">
            <span className="text-xs text-[var(--muted)] block mb-1">Comisiones Ganadas</span>
            <div className="text-2xl font-mono font-bold text-[var(--emerald)]">
              {parseFloat(formattedClaimed).toFixed(2)} USDT
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
