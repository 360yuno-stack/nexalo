'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useUserBalances, useClaimableBalances, useClaimStable, useClaimNXL } from '@/hooks/useNexaloProtocol';
import { TransactionButton } from '@/components/TransactionButton';
import { CONFIG } from '@/lib/config';
import { ABIS } from '@/lib/abis';
import { formatUnits } from 'viem';

export function AccountSection() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { usdtBalance, nxlBalance } = useUserBalances();
  const { claimableStable, claimableNXL, refetch: refetchClaimable } = useClaimableBalances();
  const { claim: claimStable } = useClaimStable();
  const { claim: claimNxl } = useClaimNXL();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isConnected) {
    return null;
  }

  const formattedClaimable = claimableStable ? formatUnits(claimableStable, 18) : '0.00';
  const formattedClaimableNXL = claimableNXL ? formatUnits(claimableNXL, 18) : '0.00';
  const hasClaimableStable = claimableStable && claimableStable > 0n;
  const hasClaimableNXL = claimableNXL && claimableNXL > 0n;

  const handleClaimStable = async () => {
    const hash = await claimStable();
    if (hash) setTimeout(() => refetchClaimable(), 3000);
    return hash;
  };

  const handleClaimNXL = async () => {
    const hash = await claimNxl();
    if (hash) setTimeout(() => refetchClaimable(), 3000);
    return hash;
  };

  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)]" id="account">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 font-display">Mi <span className="text-glow-blue text-[var(--blue)]">Cuenta</span></h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Balance USDT */}
          <div className="glass p-6 rounded-2xl card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--emerald)] opacity-[0.05] rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <span className="text-[var(--muted)] text-sm mb-2 block font-bold tracking-widest uppercase">Balance USDT</span>
            <div className="text-3xl font-mono font-bold text-[var(--emerald)] mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" suppressHydrationWarning>
               {usdtBalance ? parseFloat(formatUnits(usdtBalance as bigint, 18)).toLocaleString(undefined, {maximumFractionDigits: 2}) : '0.00'}
            </div>
            <div className="text-sm text-[var(--muted)]">Tokens listos para adquirir Nexums</div>
          </div>

          {/* Balance NXL */}
          <div className="glass p-6 rounded-2xl card-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] opacity-[0.05] rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <span className="text-[var(--muted)] text-sm mb-2 block font-bold tracking-widest uppercase">Balance NXL</span>
            <div className="text-3xl font-mono font-bold text-[var(--blue)] mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" suppressHydrationWarning>
              {nxlBalance ? parseFloat(formatUnits(nxlBalance as bigint, 18)).toLocaleString(undefined, {maximumFractionDigits: 2}) : '0.00'}
            </div>
            <div className="text-sm text-[var(--muted)]">Tokens de recompensa y gobernanza</div>
          </div>

          {/* Premios USDT Acumulados */}
          <div className="glass p-6 rounded-2xl card-hover relative overflow-hidden border border-[rgba(245,158,11,0.2)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)] opacity-[0.05] rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <span className="text-[var(--muted)] text-sm mb-2 block font-bold tracking-widest uppercase">Premios USDT</span>
            <div className="text-3xl font-mono font-bold text-[var(--gold)] mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" suppressHydrationWarning>
              {parseFloat(formattedClaimable).toLocaleString(undefined, {maximumFractionDigits: 2})} <span className="text-lg">USDT</span>
            </div>
            {hasClaimableStable ? (
              <TransactionButton
                onClick={handleClaimStable}
                chainIdRequired={CONFIG.NETWORK.chainId}
                successMessage="Premios USDT retirados."
              >
                <span className="w-full btn-outline border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-white block text-center py-2 text-sm">
                  Retirar USDT
                </span>
              </TransactionButton>
            ) : (
              <div className="text-xs text-[var(--muted)] text-center py-2">Sin premios pendientes</div>
            )}
          </div>

          {/* Premios NXL Acumulados */}
          <div className="glass p-6 rounded-2xl card-hover relative overflow-hidden border border-[rgba(59,130,246,0.2)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] opacity-[0.05] rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <span className="text-[var(--muted)] text-sm mb-2 block font-bold tracking-widest uppercase">Premios NXL</span>
            <div className="text-3xl font-mono font-bold text-[var(--blue)] mb-4 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" suppressHydrationWarning>
              {parseFloat(formattedClaimableNXL).toLocaleString(undefined, {maximumFractionDigits: 2})} <span className="text-lg">NXL</span>
            </div>
            {hasClaimableNXL ? (
              <TransactionButton
                onClick={handleClaimNXL}
                chainIdRequired={CONFIG.NETWORK.chainId}
                successMessage="Tokens NXL retirados."
              >
                <span className="w-full btn-outline border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue)] hover:text-white block text-center py-2 text-sm">
                  Retirar NXL
                </span>
              </TransactionButton>
            ) : (
              <div className="text-xs text-[var(--muted)] text-center py-2">Sin NXL pendientes</div>
            )}
          </div>
        </div>

        {/* Historial */}
        <div className="glass p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-display">Historial de Participación</h3>
            <span className="text-sm text-[var(--blue)] font-mono">{address?.slice(0,6)}...{address?.slice(-4)}</span>
          </div>
          <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl bg-[rgba(255,255,255,0.02)]">
            <p className="text-[var(--muted)]">Aún no tienes tickets en rondas activas.</p>
            <a href="#comprar" className="btn-primary mt-6 inline-block">Adquirir mi primer Nexum</a>
          </div>
        </div>
      </div>
    </section>
  );
}
