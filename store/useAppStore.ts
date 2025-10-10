import { create } from 'zustand';
import { formatUnits } from 'viem';
import { AppState } from '@/types/state';
import { TokenBalance, NativeBalance } from '@/types/wallet';
import { LendPosition, BorrowPosition } from '@/types/morpho';
import { WorldChainRPCClient } from '@/lib/worldchain-rpc';
import { WORLD_CHAIN_TOKENS } from '@/lib/token-config';

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  walletAddress: null,
  isConnecting: false,
  tokenBalances: [],
  nativeBalance: null,
  lendPositions: [],
  borrowPositions: [],
  isLoading: false,
  error: null,
  activeTab: 'wallet',
  lastUpdate: null,
  debugLogs: [],

  // Actions
  actions: {
    setWalletAddress: (address: string | null) => {
      set({ walletAddress: address });
      if (address) {
        get().actions.clearDebugLogs();
        get().actions.fetchDashboardData();
      }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    addDebugLog: (log: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const logWithTime = `[${timestamp}] ${log}`;
      console.log(logWithTime);
      set(state => ({
        debugLogs: [...state.debugLogs, logWithTime]
      }));
    },

    clearDebugLogs: () => set({ debugLogs: [] }),

    fetchDashboardData: async () => {
      const { walletAddress, actions } = get();
      if (!walletAddress) return;

      actions.addDebugLog(`Starting fetchDashboardData for wallet: ${walletAddress}`);
      set({ isLoading: true, error: null });

      try {
        const rpcClient = WorldChainRPCClient.getInstance();
        // Set up logger to capture RPC logs
        rpcClient.setExternalLogger((msg) => actions.addDebugLog(msg));

        // Fetch prices first
        actions.addDebugLog('Fetching prices...');
        const priceResponse = await fetch('/api/prices');
        const prices = priceResponse.ok ? await priceResponse.json() : {};
        actions.addDebugLog(`Prices: ${JSON.stringify(prices)}`);

        // Fetch all data in parallel
        actions.addDebugLog('Fetching balances and positions...');
        const [tokenBalancesRaw, nativeBalanceRaw, lendPositions, borrowPositions] = await Promise.all([
          rpcClient.getTokenBalances(walletAddress as `0x${string}`, WORLD_CHAIN_TOKENS),
          rpcClient.getNativeBalance(walletAddress as `0x${string}`),
          rpcClient.getLendPositions(walletAddress) as Promise<LendPosition[]>,
          rpcClient.getBorrowPositions(walletAddress) as Promise<BorrowPosition[]>
        ]);

        actions.addDebugLog(`Token balances raw count: ${tokenBalancesRaw.length}`);
        actions.addDebugLog(`Native balance raw: ${nativeBalanceRaw.toString()}`);

        // Format token balances
        const tokenBalances: TokenBalance[] = tokenBalancesRaw.map(({ token, balance }) => {
          const formattedBalance = formatUnits(balance, token.decimals);
          const priceUsd = prices[token.symbol] || 0;
          const balanceUsd = parseFloat(formattedBalance) * priceUsd;

          actions.addDebugLog(`${token.symbol}: raw=${balance.toString()}, formatted=${formattedBalance}, price=$${priceUsd}, usd=$${balanceUsd.toFixed(2)}`);

          return {
            ...token,
            balance: formattedBalance,
            balanceRaw: balance,
            balanceUsd,
            priceUsd
          };
        });

        actions.addDebugLog(`Final token balances: ${tokenBalances.length} tokens`);

        // Format native balance
        const nativeBalance: NativeBalance = {
          symbol: 'ETH',
          balance: formatUnits(nativeBalanceRaw, 18),
          balanceRaw: nativeBalanceRaw,
          balanceUsd: parseFloat(formatUnits(nativeBalanceRaw, 18)) * (prices.WETH || 0),
          priceUsd: prices.WETH || 0
        };

        actions.addDebugLog(`Setting state: ${tokenBalances.length} tokens, ${lendPositions.length} lend positions, ${borrowPositions.length} borrow positions`);

        set({
          tokenBalances,
          nativeBalance,
          lendPositions,
          borrowPositions,
          isLoading: false,
          lastUpdate: new Date()
        });

        actions.addDebugLog('State updated successfully');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch data';
        actions.addDebugLog(`ERROR: ${errorMsg}`);
        console.error('[Store] Error fetching dashboard data:', error);
        set({
          error: errorMsg,
          isLoading: false
        });
      }
    },

    refreshData: async () => {
      const { walletAddress } = get();
      if (!walletAddress) return;

      // Clear cache before refreshing
      const rpcClient = WorldChainRPCClient.getInstance();
      rpcClient.clearDebugLogs();

      await get().actions.fetchDashboardData();
    },

    clearState: () => {
      set({
        walletAddress: null,
        tokenBalances: [],
        nativeBalance: null,
        lendPositions: [],
        borrowPositions: [],
        isLoading: false,
        error: null,
        lastUpdate: null
      });
    }
  }
}));
