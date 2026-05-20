'use client';

import { useState } from 'react';
import { CONFIG } from '@/lib/config';
import { useAccount, useReadContract } from 'wagmi';
import { ABIS } from '@/lib/abis';
import { useApproveUSDT, useProvideLiquidity, useUserBalances } from '@/hooks/useNexaloProtocol';
import { TransactionButton } from '@/components/TransactionButton';
import { parseUnits, formatUnits } from 'viem';

export function InvestorSection() {
  const { address } = useAccount();
  const { usdtBalance } = useUserBalances();
  const { approve } = useApproveUSDT();
  const { provideLiquidity } = useProvideLiquidity();

  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [usdtAmount, setUsdtAmount] = useState<string>("100");
  const [rounds, setRounds] = useState<number>(1);
  
  const selectedProduct = CONFIG.PRODUCTS.find(p => p.id === selectedProductId) || CONFIG.PRODUCTS[0];

  // Read current round
  const { data: currentRound } = useReadContract({
    address: CONFIG.CONTRACTS.NEXUM_MANAGER,
    abi: ABIS.NEXUM_MANAGER,
    functionName: 'currentRound',
    args: [BigInt(selectedProductId)]
  });

  const roundId = currentRound !== undefined ? Number(currentRound) : 1;

  // Read liquidity status from contract
  const { data: liquidityStatus } = useReadContract({
    address: CONFIG.CONTRACTS.NEXUM_MANAGER,
    abi: ABIS.NEXUM_MANAGER,
    functionName: 'getRoundLiquidityStatus',
    args: [BigInt(selectedProductId), BigInt(roundId)],
    query: { enabled: roundId > 0 }
  });

  // Parse liquidity data
  const target = liquidityStatus ? Number(formatUnits((liquidityStatus as any)[0] as bigint, 18)) : 0;
  const funded = liquidityStatus ? Number(formatUnits((liquidityStatus as any)[1] as bigint, 18)) : 0;
  const progressBps = liquidityStatus ? Number((liquidityStatus as any)[6]) : 0;
  const progressPercent = progressBps / 100;

  // Read investor position
  const { data: investorPosition } = useReadContract({
    address: CONFIG.CONTRACTS.NEXUM_MANAGER,
    abi: ABIS.NEXUM_MANAGER,
    functionName: 'getInvestorPosition',
    args: [BigInt(selectedProductId), BigInt(roundId), address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address && roundId > 0 }
  });

  const myPrincipal = investorPosition ? Number(formatUnits((investorPosition as any)[0] as bigint, 18)) : 0;
  const myEstProfit = investorPosition ? Number(formatUnits((investorPosition as any)[1] as bigint, 18)) : 0;
  const myEstTotal = investorPosition ? Number(formatUnits((investorPosition as any)[2] as bigint, 18)) : 0;

  const rawAmount = usdtAmount ? parseUnits(usdtAmount, 18) : 0n;

  // Check USDT allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONFIG.CONTRACTS.USDT,
    abi: ABIS.NXL_TOKEN,
    functionName: 'allowance',
    args: [address ?? '0x0000000000000000000000000000000000000000', CONFIG.CONTRACTS.NEXUM_MANAGER],
    query: { enabled: !!address }
  });

  const needsApproval = allowance === undefined || (allowance as bigint) < rawAmount;

  const handleApprove = async () => {
    if (rawAmount === 0n) throw new Error("Monto inválido");
    const hash = await approve(rawAmount);
    if (hash) setTimeout(() => refetchAllowance(), 2000);
    return hash;
  };

  const handleInvest = async () => {
    if (rawAmount === 0n) throw new Error("Monto inválido");
    return await provideLiquidity(selectedProduct.id, roundId, rawAmount);
  };

  // PCT_INVESTOR = 300 bps = 3% ROI per round on invested capital
  const inputAmount = Number(usdtAmount) || 0;
  const profitPerRound = inputAmount * 0.03; // 3% per round
  const totalProfit = profitPerRound * rounds;
  const totalReturn = inputAmount + totalProfit;
  const roiPercent = rounds * 3; // 3% × rondas

  return (
    <section className="py-24 px-4 relative border-t border-[var(--border)] overflow-hidden" id="inversor">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00FF41] opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-4 font-display">Portal de <span className="text-[#00FF41] drop-shadow-[0_0_10px_rgba(0,255,65,0.8)]">Liquidez</span></h2>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto mb-16">
          Proporciona liquidez en USDT a las rondas activas y obtén un porcentaje directo de las ganancias generadas por la red.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {CONFIG.PRODUCTS.map(p => (
            <button 
              key={p.id}
              onClick={() => setSelectedProductId(p.id)}
              className={`px-6 py-2 rounded-lg font-bold transition-all border ${selectedProductId === p.id ? 'bg-[#1a1a2e] text-[#00FF41] border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.5)]' : 'bg-transparent border-[var(--border)] text-[var(--muted)] hover:border-[rgba(0,255,65,0.5)] hover:text-white'}`}
            >
              {p.name} {p.emoji}
            </button>
          ))}
        </div>

        <div className="max-w-[800px] mx-auto glass p-8 rounded-2xl border border-[rgba(0,255,65,0.2)] text-left shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Funding Progress */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 font-display text-white">Progreso de Financiación — Ronda #{roundId}</h3>
            <div className="flex justify-between text-sm mb-2 text-[var(--muted)]" suppressHydrationWarning>
              <span>Fondeado: {funded.toLocaleString(undefined, {maximumFractionDigits: 2})} USDT</span>
              <span>Meta: {target.toLocaleString(undefined, {maximumFractionDigits: 2})} USDT</span>
            </div>
            <div className="w-full bg-[#0a0a15] rounded-full h-3 border border-[rgba(255,255,255,0.05)]">
              <div className="bg-[#00FF41] h-3 rounded-full shadow-[0_0_10px_rgba(0,255,65,0.8)] transition-all duration-500" style={{ width: `${Math.min(progressPercent, 100)}%` }}></div>
            </div>
          </div>

          {/* My Position */}
          {myPrincipal > 0 && (
            <div className="mb-6 p-4 bg-[rgba(0,255,65,0.05)] rounded-xl border border-[rgba(0,255,65,0.15)]">
              <span className="text-sm text-[var(--muted)] block mb-1">Tu Posición en esta Ronda</span>
              <div className="flex gap-6">
                <div>
                  <span className="text-xs text-[var(--muted)]">Principal</span>
                  <div className="font-mono font-bold">{myPrincipal.toFixed(2)} USDT</div>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)]">Beneficio Est.</span>
                  <div className="font-mono font-bold text-[#00FF41]">+{myEstProfit.toFixed(2)} USDT</div>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted)]">Retorno Total</span>
                  <div className="font-mono font-bold">{myEstTotal.toFixed(2)} USDT</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
            {/* --- Left column: inputs --- */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">Monto de Inversión (USDT)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    className="w-full bg-[#05050a] border border-[rgba(255,255,255,0.1)] rounded-lg p-4 font-mono text-xl focus:border-[#00FF41] focus:outline-none transition-colors"
                    placeholder="0.00"
                    min="1"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--muted)] font-mono">USDT</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {usdtBalance && (
                    <button 
                      onClick={() => setUsdtAmount(formatUnits(usdtBalance as bigint, 18))}
                      className="flex-1 py-2 text-xs bg-[rgba(255,255,255,0.05)] rounded hover:bg-[rgba(0,255,65,0.1)] hover:text-[#00FF41] transition-colors"
                    >
                      MAX
                    </button>
                  )}
                  {[25, 50, 75].map(pct => (
                    <button 
                      key={pct}
                      onClick={() => {
                        if (usdtBalance) setUsdtAmount((Number(formatUnits(usdtBalance as bigint, 18)) * pct / 100).toString());
                      }}
                      className="flex-1 py-2 text-xs bg-[rgba(255,255,255,0.05)] rounded hover:bg-[rgba(0,255,65,0.1)] hover:text-[#00FF41] transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds selector */}
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">Período (Rondas)</label>
                <div className="flex gap-2">
                  {[1, 3, 5, 10, 20].map(r => (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${
                        rounds === r
                          ? 'bg-[rgba(0,255,65,0.15)] border-[#00FF41] text-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.3)]'
                          : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[var(--muted)] hover:border-[rgba(0,255,65,0.4)] hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* --- Right column: ROI card --- */}
            <div className="bg-[#0d1117] p-6 rounded-2xl border border-[rgba(0,255,65,0.15)] text-center shadow-[0_0_30px_rgba(0,255,65,0.07)] space-y-4">
              {/* Main metric */}
              <div>
                <span className="text-[var(--muted)] text-xs uppercase tracking-widest block mb-1">Retorno Estimado</span>
                <div className="text-4xl font-mono font-bold text-[#00FF41] drop-shadow-[0_0_12px_rgba(0,255,65,0.7)]" suppressHydrationWarning>
                  ${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>

              {/* ROI row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[rgba(0,255,65,0.05)] rounded-xl p-3">
                  <span className="text-[var(--muted)] text-xs block">ROI Total</span>
                  <span className="text-[#00FF41] font-bold text-lg">{roiPercent.toFixed(1)}%</span>
                </div>
                <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3">
                  <span className="text-[var(--muted)] text-xs block">Por Ronda</span>
                  <span className="text-white font-bold text-lg" suppressHydrationWarning>${profitPerRound.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              {/* Capital + gains */}
              <div className="border-t border-[rgba(255,255,255,0.05)] pt-3">
                <span className="text-[var(--muted)] text-xs block mb-1">Capital + Ganancias</span>
                <span className="text-white font-mono font-bold text-xl" suppressHydrationWarning>${totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT</span>
              </div>

              <div className="mt-2">
                {needsApproval ? (
                  <TransactionButton 
                    onClick={handleApprove} 
                    chainIdRequired={CONFIG.NETWORK.chainId}
                    successMessage="USDT Aprobado. Ahora puedes proveer la liquidez."
                  >
                    <span className="w-full btn-outline border-[#00FF41] text-[#00FF41] block text-center py-3 rounded-lg">Aprobar USDT</span>
                  </TransactionButton>
                ) : (
                  <TransactionButton 
                    onClick={handleInvest} 
                    chainIdRequired={CONFIG.NETWORK.chainId}
                    successMessage="Liquidez proveída con éxito."
                  >
                    <span className="w-full bg-[#00FF41] text-black font-bold block text-center py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,255,65,0.6)] transition-all">Proveer Liquidez →</span>
                  </TransactionButton>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-6 opacity-60">
            *El beneficio estimado se calcula basándose en el 3% de inversores (PCT_INVESTOR) del volumen total de la ronda. Las ganancias reales dependen del volumen on-chain.
          </p>
        </div>
      </div>
    </section>
  );
}
