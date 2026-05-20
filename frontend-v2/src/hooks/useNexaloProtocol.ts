'use client';

import { useReadContract, useWriteContract, useAccount, useReadContracts } from 'wagmi';
import { CONFIG } from '@/lib/config';
import { ABIS } from '@/lib/abis';

// ── Protocol State ──────────────────────────────────────────────────────

export function useProtocolState() {
  const { data: globalStopped, isLoading: isLoadingStopped } = useReadContract({
    address: CONFIG.CONTRACTS.NEXUM_MANAGER,
    abi: ABIS.NEXUM_MANAGER,
    functionName: 'globalStopped',
  });

  const { data: paused, isLoading: isLoadingPaused } = useReadContract({
    address: CONFIG.CONTRACTS.NEXUM_MANAGER,
    abi: ABIS.NEXUM_MANAGER,
    functionName: 'paused',
  });

  return {
    globalStopped,
    paused,
    isLoading: isLoadingStopped || isLoadingPaused,
  };
}

// ── User Balances ───────────────────────────────────────────────────────

export function useUserBalances() {
  const { address } = useAccount();

  const { data, refetch, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONFIG.CONTRACTS.USDT,
        abi: ABIS.NXL_TOKEN,
        functionName: 'balanceOf',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      },
      {
        address: CONFIG.CONTRACTS.NXL_TOKEN,
        abi: ABIS.NXL_TOKEN,
        functionName: 'balanceOf',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      }
    ],
    query: {
      enabled: !!address,
    }
  });

  return {
    usdtBalance: data?.[0]?.result,
    nxlBalance: data?.[1]?.result,
    refetch,
    isLoading,
  };
}

// ── User Claimable Balances ─────────────────────────────────────────────

export function useClaimableBalances() {
  const { address } = useAccount();

  const { data, refetch, isLoading } = useReadContracts({
    contracts: [
      {
        address: CONFIG.CONTRACTS.NEXUM_MANAGER,
        abi: ABIS.NEXUM_MANAGER,
        functionName: 'claimableStable',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      },
      {
        address: CONFIG.CONTRACTS.NEXUM_MANAGER,
        abi: ABIS.NEXUM_MANAGER,
        functionName: 'claimableNXL',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      }
    ],
    query: { enabled: !!address }
  });

  return {
    claimableStable: data?.[0]?.result as bigint | undefined,
    claimableNXL: data?.[1]?.result as bigint | undefined,
    refetch,
    isLoading,
  };
}

// ── Claim Stable (prizes from NexumManager) ─────────────────────────────

export function useClaimStable() {
  const { writeContractAsync, isPending } = useWriteContract();

  const claim = async () => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.NEXUM_MANAGER,
      abi: ABIS.NEXUM_MANAGER,
      functionName: 'claimStable',
    });
  };

  return { claim, isPending };
}

// ── Claim NXL (accrued NXL from NexumManager) ───────────────────────────

export function useClaimNXL() {
  const { writeContractAsync, isPending } = useWriteContract();

  const claim = async () => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.NEXUM_MANAGER,
      abi: ABIS.NEXUM_MANAGER,
      functionName: 'claimNXL',
    });
  };

  return { claim, isPending };
}

// ── Buy Tickets ─────────────────────────────────────────────────────────

export function useBuyTicket() {
  const { writeContractAsync, isPending } = useWriteContract();

  const buySpecific = async (productId: number, ticketNumbers: bigint[], referrer: string) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.NEXUM_MANAGER,
      abi: ABIS.NEXUM_MANAGER,
      functionName: 'buySpecificTickets',
      args: [BigInt(productId), ticketNumbers, referrer as `0x${string}`],
      gas: 15_000_000n, // Explicit cap to avoid BSC block limit estimation errors
    });
  };

  const buyRandom = async (productId: number, quantity: number, referrer: string) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.NEXUM_MANAGER,
      abi: ABIS.NEXUM_MANAGER,
      functionName: 'buyTickets',
      args: [BigInt(productId), BigInt(quantity), referrer as `0x${string}`],
      gas: 15_000_000n, // Explicit cap to avoid BSC block limit estimation errors
    });
  };

  return {
    buySpecific,
    buyRandom,
    isPending,
  };
}

// ── Approve USDT ────────────────────────────────────────────────────────

export function useApproveUSDT() {
  const { writeContractAsync, isPending } = useWriteContract();
  
  const approve = async (amount: bigint) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.USDT,
      abi: ABIS.NXL_TOKEN, // Standard ERC20 approve
      functionName: 'approve',
      args: [CONFIG.CONTRACTS.NEXUM_MANAGER, amount],
    });
  };

  return { approve, isPending };
}

// ── Approve NXL (for staking) ───────────────────────────────────────────

export function useApproveNXL() {
  const { writeContractAsync, isPending } = useWriteContract();
  
  const approve = async (amount: bigint, spender: `0x${string}`) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.NXL_TOKEN,
      abi: ABIS.NXL_TOKEN,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return { approve, isPending };
}

// ── Provide Liquidity (Investor) ────────────────────────────────────────

export function useProvideLiquidity() {
  const { writeContractAsync, isPending } = useWriteContract();

  const provideLiquidity = async (productId: number, roundId: number, amount: bigint) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.NEXUM_MANAGER,
      abi: ABIS.NEXUM_MANAGER,
      functionName: 'provideRoundLiquidity',
      args: [BigInt(productId), BigInt(roundId), amount],
    });
  };

  return { provideLiquidity, isPending };
}

// ── Staking NXL ─────────────────────────────────────────────────────────

export function useStakeNXL() {
  const { writeContractAsync, isPending } = useWriteContract();

  const stake = async (amount: bigint) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.STAKING as `0x${string}`,
      abi: ABIS.STAKING,
      functionName: 'stake',
      args: [amount],
    });
  };

  return { stake, isPending };
}

export function useUnstakeNXL() {
  const { writeContractAsync, isPending } = useWriteContract();

  const unstake = async (amount: bigint) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.STAKING as `0x${string}`,
      abi: ABIS.STAKING,
      functionName: 'unstake',
      args: [amount],
    });
  };

  return { unstake, isPending };
}

export function useClaimStakingRewards() {
  const { writeContractAsync, isPending } = useWriteContract();

  const claimRewards = async () => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.STAKING as `0x${string}`,
      abi: ABIS.STAKING,
      functionName: 'claimRewards',
    });
  };

  return { claimRewards, isPending };
}

export function useStakingInfo() {
  const { address } = useAccount();
  
  const { data: userInfo, refetch } = useReadContract({
    address: CONFIG.CONTRACTS.STAKING as `0x${string}`,
    abi: ABIS.STAKING,
    functionName: 'users',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address && CONFIG.CONTRACTS.STAKING !== '0x0000000000000000000000000000000000000000' }
  });

  const { data: pending } = useReadContract({
    address: CONFIG.CONTRACTS.STAKING as `0x${string}`,
    abi: ABIS.STAKING,
    functionName: 'pendingRewards',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address && CONFIG.CONTRACTS.STAKING !== '0x0000000000000000000000000000000000000000' }
  });

  return {
    stakedAmount: (userInfo as any)?.[0] as bigint | undefined,
    totalClaimed: (userInfo as any)?.[2] as bigint | undefined,
    pendingRewards: pending as bigint | undefined,
    refetch,
  };
}

// ── Ambassador ──────────────────────────────────────────────────────────

export function useAmbassadorInfo() {
  const { address } = useAccount();

  const { data: approved } = useReadContract({
    address: CONFIG.CONTRACTS.AMBASSADOR_REGISTRY,
    abi: ABIS.AMBASSADOR_REGISTRY,
    functionName: 'approvedForRegistration',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address }
  });

  const { data: ambassadorData } = useReadContract({
    address: CONFIG.CONTRACTS.AMBASSADOR_REGISTRY,
    abi: ABIS.AMBASSADOR_REGISTRY,
    functionName: 'ambassadors',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address }
  });

  const { data: pendingRewards } = useReadContract({
    address: CONFIG.CONTRACTS.AMBASSADOR_REGISTRY,
    abi: ABIS.AMBASSADOR_REGISTRY,
    functionName: 'pendingRewards',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address }
  });

  const isRegistered = ambassadorData ? (ambassadorData as any)[4]?.length > 0 : false;
  const isActive = ambassadorData ? (ambassadorData as any)[0] : false;

  return {
    isApproved: approved as boolean | undefined,
    isRegistered,
    isActive,
    pendingRewards: pendingRewards as bigint | undefined,
    totalClaimed: ambassadorData ? (ambassadorData as any)[1] as bigint : undefined,
  };
}

export function useSelfRegisterAmbassador() {
  const { writeContractAsync, isPending } = useWriteContract();

  const register = async (name: string) => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.AMBASSADOR_REGISTRY,
      abi: ABIS.AMBASSADOR_REGISTRY,
      functionName: 'selfRegister',
      args: [name],
    });
  };

  return { register, isPending };
}

export function useClaimAmbassadorRewards() {
  const { writeContractAsync, isPending } = useWriteContract();

  const claim = async () => {
    return await writeContractAsync({
      address: CONFIG.CONTRACTS.AMBASSADOR_REGISTRY,
      abi: ABIS.AMBASSADOR_REGISTRY,
      functionName: 'claim',
    });
  };

  return { claim, isPending };
}
