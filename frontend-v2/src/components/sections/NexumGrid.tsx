'use client';

import { useState } from 'react';
import { CONFIG } from '@/lib/config';
import { useBuyTicket, useApproveUSDT, useUserBalances } from '@/hooks/useNexaloProtocol';
import { TransactionButton } from '@/components/TransactionButton';
import { parseUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { ABIS } from '@/lib/abis';

export function NexumGrid() {
  const { buyRandom } = useBuyTicket();
  const { approve } = useApproveUSDT();
  const { address } = useAccount();
  const { usdtBalance } = useUserBalances();

  // Selected product state
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const selectedProduct = CONFIG.PRODUCTS.find(p => p.id === selectedProductId) || CONFIG.PRODUCTS[0];

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONFIG.CONTRACTS.USDT,
    abi: ABIS.NXL_TOKEN, // Standard ERC20 allowance
    functionName: 'allowance',
    args: [address ?? '0x0000000000000000000000000000000000000000', CONFIG.CONTRACTS.NEXUM_MANAGER],
    query: { enabled: !!address }
  });

  const totalCostUSD = selectedProduct.price * quantity;
  const totalCostRaw = parseUnits(totalCostUSD.toString(), 18);
  const needsApproval = allowance === undefined || (allowance as bigint) < totalCostRaw;

  // Handler for buying
  const handleBuy = async () => {
    if (usdtBalance !== undefined && (usdtBalance as bigint) < totalCostRaw) {
      throw new Error("Saldo insuficiente de USDT");
    }
    if (allowance === undefined || (allowance as bigint) < totalCostRaw) {
      throw new Error("Debes aprobar USDT primero");
    }

    // Read referrer from URL params (?ref=0x...)
    let referrer = '0x0000000000000000000000000000000000000000';
    if (typeof window !== 'undefined') {
      const urlRef = new URLSearchParams(window.location.search).get('ref');
      if (urlRef && /^0x[0-9a-fA-F]{40}$/.test(urlRef)) {
        referrer = urlRef;
      }
    }
    return await buyRandom(selectedProduct.id, quantity, referrer);
  };

  const handleApprove = async () => {
    const hash = await approve(totalCostRaw);
    if (hash) {
      // Force refetch allowance so the button switches to "Buy"
      setTimeout(() => refetchAllowance(), 2000); 
    }
    return hash;
  };

  // Helper function to map product names to legacy color classes
  const getPrizeColorClass = (name: string) => {
    if (name.includes('Flash')) return 'prize-flash';
    if (name.includes('Original')) return 'prize-original';
    if (name.includes('Premium')) return 'prize-premium';
    if (name.includes('Elite')) return 'prize-elite';
    if (name.includes('VIP')) return 'prize-vip';
    return 'prize-blackblok';
  };

  return (
    <section className="py-24 px-4 relative" id="comprar">
      <div className="max-w-[1400px] mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">Selecciona tu <span className="text-glow-blue text-[var(--blue)]">Nexum</span></h2>
        <p className="text-[var(--muted)] text-lg max-w-2xl mx-auto">
          Participa en rondas automatizadas. Los contratos inteligentes distribuyen el 96% del volumen generado.
        </p>
      </div>

      <div className="nexum-grid mb-16">
        {CONFIG.PRODUCTS.map((product) => (
          <div 
            key={product.id}
            onClick={() => setSelectedProductId(product.id)}
            className={`glass p-6 rounded-2xl card-hover cursor-pointer transition-all border ${selectedProductId === product.id ? 'border-[var(--blue)] shadow-[0_0_30px_rgba(59,130,246,0.3)] transform scale-105' : 'border-[var(--border)]'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold font-display">{product.name}</h3>
                <span className="text-xs text-[var(--muted)]">{product.digits} Dígitos Exactos</span>
              </div>
              <div className="text-2xl">{product.emoji}</div>
            </div>
            
            <div className="mb-6">
              <span className="text-sm text-[var(--muted)]">Premio Mayor Estimado</span>
              <div className={`text-4xl font-mono font-bold prize-amount ${getPrizeColorClass(product.name)}`} suppressHydrationWarning>
                ${product.jackpot.toLocaleString()}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
              <div>
                <span className="text-xs text-[var(--muted)] block">Precio</span>
                <span className="text-lg font-bold">${product.price} USDT</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[var(--muted)] block">Recibes</span>
                <span className="text-[var(--blue)] font-bold">+{product.nxlPerTicket} NXL</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* COMPRA INTERFACE */}
      <div className="max-w-[800px] mx-auto glass p-8 rounded-2xl border border-[var(--blue)] shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden">
        {/* Glow effect behind interface */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--blue)] opacity-[0.03] blur-[50px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1 w-full text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2 font-display">Adquirir {selectedProduct.name} {selectedProduct.emoji}</h3>
            <p className="text-[var(--muted)] text-sm mb-6">Obtén tickets y acumula NXL instantáneamente.</p>
            
            <div className="flex justify-center md:justify-start items-center gap-3 mb-6">
              {[1, 3, 5, 10].map(num => (
                <button 
                  key={num}
                  onClick={() => setQuantity(num)}
                  className={`px-5 py-2 rounded-lg font-bold transition-all border ${quantity === num ? 'bg-[var(--blue)] text-white border-[var(--blue)] shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-transparent border-[var(--border)] text-[var(--muted)] hover:border-[var(--blue)] hover:text-white'}`}
                >
                  x{num}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center md:justify-start items-center gap-4 text-xl">
              <span className="text-[var(--muted)]">Total:</span>
              <span className="text-3xl font-mono font-bold text-glow-blue" suppressHydrationWarning>${totalCostUSD.toLocaleString()} USDT</span>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
             {usdtBalance !== undefined && (usdtBalance as bigint) < totalCostRaw ? (
                <button disabled className="btn-outline w-full text-red-400 border-red-500/50 cursor-not-allowed">
                  Saldo Insuficiente
                </button>
              ) : needsApproval ? (
                <TransactionButton 
                  onClick={handleApprove} 
                  chainIdRequired={CONFIG.NETWORK.chainId}
                  successMessage="USDT Aprobado. Ahora puedes confirmar la compra."
                >
                  <span className="w-full btn-primary block text-center">1. Aprobar USDT</span>
                </TransactionButton>
              ) : (
                <TransactionButton 
                  onClick={handleBuy} 
                  chainIdRequired={CONFIG.NETWORK.chainId}
                  successMessage={`¡Compra exitosa! Recibiste ${(selectedProduct.nxlPerTicket * quantity).toFixed(2)} NXL.`}
                >
                  <span className="w-full btn-primary block text-center text-lg py-4">Ejecutar Smart Contract</span>
                </TransactionButton>
              )}
            <p className="text-xs text-center text-[var(--muted)] mt-2">
              Auditoría: Verificada <br/> Red: {CONFIG.NETWORK.chainName}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
