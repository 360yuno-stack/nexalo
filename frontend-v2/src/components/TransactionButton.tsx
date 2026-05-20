'use client';

import { useAccount, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';

function useSafeAppKit() {
  if (typeof window === 'undefined') {
    return { open: () => {} };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAppKit();
}

interface TransactionButtonProps {
  onClick: () => Promise<`0x${string}` | undefined>;
  children: React.ReactNode;
  chainIdRequired: number;
  className?: string;
  successMessage?: string;
}

export function TransactionButton({ 
  onClick, 
  children, 
  chainIdRequired, 
  className = "btn-gradient px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50",
  successMessage = "Transacción confirmada exitosamente."
}: TransactionButtonProps) {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { open } = useSafeAppKit();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleClick = async () => {
    if (!isConnected) {
      open();
      return;
    }

    if (chainId !== chainIdRequired) {
      toast.error('Red incorrecta', { description: 'Por favor, cambia a BNB Smart Chain' });
      switchChain({ chainId: chainIdRequired });
      return;
    }

    try {
      const toastId = toast.loading('Esperando firma...');
      
      const hash = await onClick();
      if (!hash) {
        toast.dismiss(toastId);
        return;
      }
      
      setTxHash(hash);
      
      toast.loading('Transacción en progreso...', {
        id: toastId,
        description: `Hash: ${hash.slice(0,6)}...${hash.slice(-4)}`,
        action: {
          label: 'Ver Explorer',
          onClick: () => window.open(`https://testnet.bscscan.com/tx/${hash}`, '_blank')
        }
      });

    } catch (error: any) {
      console.error(error);
      toast.error('Error en la transacción', {
        description: error?.shortMessage || error?.message || 'La transacción fue rechazada o falló.'
      });
    }
  };

  // Effect to handle receipt
  if (isSuccess && txHash) {
    toast.success('¡Completado!', {
      id: txHash, // Use hash to replace the loading toast
      description: successMessage,
    });
    setTxHash(undefined);
  }

  return (
    <button 
      onClick={handleClick}
      disabled={isWaiting}
      className={className}
    >
      {isWaiting ? 'Confirmando...' : children}
    </button>
  );
}
