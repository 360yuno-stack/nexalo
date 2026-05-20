'use client';

import { useState } from 'react';
import { useUserBalances, useStakeNXL, useUnstakeNXL, useClaimStakingRewards, useStakingInfo, useApproveNXL } from '@/hooks/useNexaloProtocol';
import { TransactionButton } from '@/components/TransactionButton';
import { formatUnits, parseUnits } from 'viem';
import { CONFIG } from '@/lib/config';
import { useAccount, useReadContract } from 'wagmi';
import { ABIS } from '@/lib/abis';

export function StakingSection() {
  const { address } = useAccount();
  const { nxlBalance } = useUserBalances();
  const { stake } = useStakeNXL();
  const { unstake } = useUnstakeNXL();
  const { claimRewards } = useClaimStakingRewards();
  const { stakedAmount, pendingRewards, refetch: refetchStaking } = useStakingInfo();
  const { approve } = useApproveNXL();
  
  const [stakeAmount, setStakeAmount] = useState('');
  const [mode, setMode] = useState<'stake' | 'unstake'>('stake');

  const formattedNXL = nxlBalance ? formatUnits(nxlBalance as bigint, 18) : '0.00';
  const formattedStaked = stakedAmount ? formatUnits(stakedAmount, 18) : '0.00';
  const formattedPending = pendingRewards ? formatUnits(pendingRewards, 8) : '0.00000000'; // WBTC is 8 decimals

  const rawAmount = stakeAmount ? parseUnits(stakeAmount, 18) : 0n;

  // Check NXL allowance for staking contract
  const { data: nxlAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONFIG.CONTRACTS.NXL_TOKEN,
    abi: ABIS.NXL_TOKEN,
    functionName: 'allowance',
    args: [address ?? '0x0000000000000000000000000000000000000000', CONFIG.CONTRACTS.STAKING],
    query: { enabled: !!address && CONFIG.CONTRACTS.STAKING !== '0x0000000000000000000000000000000000000000' }
  });

  const needsApproval = mode === 'stake' && (nxlAllowance === undefined || (nxlAllowance as bigint) < rawAmount);

  const handleApproveNXL = async () => {
    if (rawAmount === 0n) throw new Error("Monto inválido");
    const hash = await approve(rawAmount, CONFIG.CONTRACTS.STAKING as `0x${string}`);
    if (hash) setTimeout(() => refetchAllowance(), 2000);
    return hash;
  };

  const handleStake = async () => {
    if (rawAmount === 0n) throw new Error("Ingresa una cantidad válida");
    const hash = await stake(rawAmount);
    if (hash) setTimeout(() => refetchStaking(), 3000);
    return hash;
  };

  const handleUnstake = async () => {
    if (rawAmount === 0n) throw new Error("Ingresa una cantidad válida");
    const hash = await unstake(rawAmount);
    if (hash) setTimeout(() => refetchStaking(), 3000);
    return hash;
  };

  const handleClaim = async () => {
    const hash = await claimRewards();
    if (hash) setTimeout(() => refetchStaking(), 3000);
    return hash;
  };

  const stakingDisabled = CONFIG.CONTRACTS.STAKING === '0x0000000000000000000000000000000000000000';

  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden" id="staking">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--blue)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">
            Staking <span className="text-glow-blue text-[var(--blue)]">Institucional</span>
          </h2>
          <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
            Haz stake de tus tokens NXL para generar ingresos pasivos en WBTC (Bitcoin). Dividendos inyectados automáticamente desde TreasuryBTC.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 max-w-[900px] mx-auto">
          {/* Staking Info Card */}
          <div className="flex-1 glass p-8 rounded-2xl border border-[var(--border)] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] opacity-[0.05] rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-xl font-bold mb-6 font-display flex items-center gap-2">
              <span className="text-2xl">🏦</span> Tu Bóveda NXL
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[var(--border)]">
                <span className="text-[var(--muted)] text-sm">Balance Disponible</span>
                <span className="text-xl font-bold font-mono" suppressHydrationWarning>{parseFloat(formattedNXL).toLocaleString(undefined, {maximumFractionDigits: 2})} NXL</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[rgba(59,130,246,0.05)] rounded-xl border border-[var(--blue)] shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <span className="text-[var(--blue)] font-bold text-sm">En Stake</span>
                <span className="text-xl font-bold text-[var(--blue)] font-mono drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" suppressHydrationWarning>{parseFloat(formattedStaked).toLocaleString(undefined, {maximumFractionDigits: 2})} NXL</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[rgba(245,158,11,0.05)] rounded-xl border border-[rgba(245,158,11,0.3)]">
                <span className="text-[var(--gold)] font-bold text-sm">Recompensas (WBTC)</span>
                <span className="text-xl font-bold text-[var(--gold)] font-mono">{formattedPending} WBTC</span>
              </div>
            </div>

            {/* Claim WBTC Button */}
            {pendingRewards && pendingRewards > 0n && (
              <div className="mt-4">
                <TransactionButton 
                  onClick={handleClaim}
                  chainIdRequired={CONFIG.NETWORK.chainId}
                  successMessage="Recompensas WBTC reclamadas con éxito."
                >
                  <span className="w-full btn-outline border-[var(--gold)] text-[var(--gold)] block text-center py-3 hover:bg-[var(--gold)] hover:text-black transition-all">Reclamar WBTC</span>
                </TransactionButton>
              </div>
            )}
          </div>

          {/* Staking Actions Card */}
          <div className="flex-1 glass p-8 rounded-2xl border border-[var(--border)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--emerald)] opacity-[0.05] rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2"></div>
            <div>
              <h3 className="text-xl font-bold mb-2 font-display">Operaciones</h3>
              <p className="text-sm text-[var(--muted)] mb-6">
                El staking NXL no tiene lock period. Puedes retirar en cualquier momento. Los dividendos WBTC se acumulan por ronda.
              </p>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setMode('stake')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'stake' ? 'bg-[var(--blue)] text-white' : 'bg-transparent border border-[var(--border)] text-[var(--muted)]'}`}
                >
                  Depositar
                </button>
                <button 
                  onClick={() => setMode('unstake')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'unstake' ? 'bg-red-500/80 text-white' : 'bg-transparent border border-[var(--border)] text-[var(--muted)]'}`}
                >
                  Retirar
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-[var(--muted)] mb-2 uppercase tracking-widest">
                  Cantidad ({mode === 'stake' ? 'Depositar' : 'Retirar'}) NXL
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)} 
                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[var(--border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[var(--blue)] transition-colors font-mono"
                  />
                  <button 
                    onClick={() => {
                      if (mode === 'stake' && nxlBalance) setStakeAmount(formatUnits(nxlBalance as bigint, 18));
                      if (mode === 'unstake' && stakedAmount) setStakeAmount(formatUnits(stakedAmount, 18));
                    }}
                    className="absolute right-2 top-2 text-xs bg-[var(--blue)] text-white px-3 py-1.5 rounded font-bold hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {stakingDisabled ? (
                <button disabled className="w-full py-4 rounded-xl font-bold bg-gray-600/50 text-gray-400 cursor-not-allowed text-sm">
                  Staking pendiente de deploy
                </button>
              ) : mode === 'stake' ? (
                needsApproval ? (
                  <TransactionButton 
                    onClick={handleApproveNXL}
                    chainIdRequired={CONFIG.NETWORK.chainId}
                    successMessage="NXL aprobado para staking."
                  >
                    <span className="w-full btn-outline block text-center py-4 text-sm">1. Aprobar NXL</span>
                  </TransactionButton>
                ) : (
                  <TransactionButton 
                    onClick={handleStake}
                    chainIdRequired={CONFIG.NETWORK.chainId}
                    successMessage="Staking completado con éxito."
                  >
                    <span className="w-full btn-primary block text-center py-4 text-lg">Depositar Stake</span>
                  </TransactionButton>
                )
              ) : (
                <TransactionButton 
                  onClick={handleUnstake}
                  chainIdRequired={CONFIG.NETWORK.chainId}
                  successMessage="Unstake completado con éxito."
                >
                  <span className="w-full py-4 rounded-xl font-bold btn-outline border-red-500/50 text-red-400 hover:bg-red-500/20 block text-center text-sm uppercase tracking-widest">Retirar Stake</span>
                </TransactionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
