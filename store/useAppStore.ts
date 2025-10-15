import { create } from 'zustand';
import { formatUnits } from 'viem';
import { AppState } from '@/types/state';
import { TokenBalance, NativeBalance, WLDVaultBalance, WLDSpendingBalance } from '@/types/wallet';
import { LendPosition, BorrowPosition } from '@/types/morpho';
import { WorldChainRPCClient } from '@/lib/worldchain-rpc';
import { WorldAppVaultClient } from '@/lib/worldapp-vault';
import { WORLD_CHAIN_TOKENS } from '@/lib/token-config';

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  walletAddress: null,
  isConnecting: false,
  tokenBalances: [],
  nativeBalance: null,
  wldVaultBalance: null,
  wldSpendingBalance: null,
  lendPositions: [],
  borrowPositions: [],
  isLoading: false,
  error: null,
  activeTab: 'wallet',
  lastUpdate: null,
  walletDataLoaded: false,
  lendDataLoaded: false,
  borrowDataLoaded: false,
  debugLogs: [],

  // Actions
  actions: {
    setWalletAddress: (address: string | null) => {
      set({ walletAddress: address });
      if (address) {
        get().actions.clearDebugLogs();
        // Only fetch wallet data on initial connection
        get().actions.fetchWalletData();
      }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    addDebugLog: (log: string) => {
      // Check if debug info is enabled before logging
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('morpho-monitor-settings');
          if (stored) {
            const settings = JSON.parse(stored);
            if (!settings.showDebugInfo) {
              // Debug info is disabled, skip logging
              return;
            }
          } else {
            // No settings stored, default is false, skip logging
            return;
          }
        } catch (error) {
          // If we can't read settings, skip logging to be safe
          return;
        }
      }

      const timestamp = new Date().toLocaleTimeString();
      const logWithTime = `[${timestamp}] ${log}`;
      console.log(logWithTime);
      set(state => ({
        debugLogs: [...state.debugLogs, logWithTime]
      }));
    },

    clearDebugLogs: () => set({ debugLogs: [] }),

    fetchWalletData: async () => {
      const { walletAddress, actions, walletDataLoaded } = get();
      if (!walletAddress) return;

      // Skip if already loaded
      if (walletDataLoaded) {
        actions.addDebugLog('Wallet data already loaded, skipping...');
        return;
      }

      actions.addDebugLog(`Starting fetchWalletData for wallet: ${walletAddress}`);
      set({ isLoading: true, error: null });

      try {
        const rpcClient = WorldChainRPCClient.getInstance();
        rpcClient.setExternalLogger((msg) => actions.addDebugLog(msg));

        const vaultClient = WorldAppVaultClient.getInstance();
        vaultClient.setExternalLogger((msg) => actions.addDebugLog(msg));

        // Fetch prices
        actions.addDebugLog('Fetching prices...');
        const priceResponse = await fetch('/api/prices');
        const prices = priceResponse.ok ? await priceResponse.json() : {};
        actions.addDebugLog(`Prices: ${JSON.stringify(prices)}`);

        const wldPriceUsd = prices.WLD || 0;

        // Fetch wallet balances (including WLD Vault and Spending from World Chain)
        actions.addDebugLog('Fetching wallet balances...');
        const [tokenBalancesRaw, nativeBalanceRaw, vaultBalance, spendingBalance] = await Promise.all([
          rpcClient.getTokenBalances(walletAddress as `0x${string}`, WORLD_CHAIN_TOKENS),
          rpcClient.getNativeBalance(walletAddress as `0x${string}`),
          vaultClient.getVaultBalance(walletAddress, wldPriceUsd),
          vaultClient.getSpendingBalance(walletAddress, wldPriceUsd)
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

        // Format native balance
        const nativeBalance: NativeBalance = {
          symbol: 'ETH',
          balance: formatUnits(nativeBalanceRaw, 18),
          balanceRaw: nativeBalanceRaw,
          balanceUsd: parseFloat(formatUnits(nativeBalanceRaw, 18)) * (prices.WETH || 0),
          priceUsd: prices.WETH || 0
        };

        // Format WLD Vault balance (locked)
        const wldVaultBalance: WLDVaultBalance | null = vaultBalance
          ? {
              amountNow: vaultBalance.amountNow,
              principal: vaultBalance.principal,
              accruedInterest: vaultBalance.accruedInterest,
              amountNowUsd: vaultBalance.amountNowUsd,
              principalUsd: vaultBalance.principalUsd,
              accruedInterestUsd: vaultBalance.accruedInterestUsd,
              symbol: 'WLD'
            }
          : null;

        // Format WLD Spending balance (liquid)
        const wldSpendingBalance: WLDSpendingBalance | null = spendingBalance
          ? {
              balance: spendingBalance.balance,
              balanceUsd: spendingBalance.balanceUsd,
              symbol: 'WLD'
            }
          : null;

        actions.addDebugLog(`WLD Vault balance: ${wldVaultBalance?.amountNow || '0'} WLD`);
        actions.addDebugLog(`WLD Spending balance: ${wldSpendingBalance?.balance || '0'} WLD`);
        actions.addDebugLog('Wallet data loaded successfully');

        set({
          tokenBalances,
          nativeBalance,
          wldVaultBalance,
          wldSpendingBalance,
          walletDataLoaded: true,
          isLoading: false,
          lastUpdate: new Date()
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch wallet data';
        actions.addDebugLog(`ERROR: ${errorMsg}`);
        console.error('[Store] Error fetching wallet data:', error);
        set({
          error: errorMsg,
          isLoading: false
        });
      }
    },

    fetchLendData: async () => {
      const { walletAddress, actions, lendDataLoaded } = get();
      if (!walletAddress) return;

      // Skip if already loaded
      if (lendDataLoaded) {
        actions.addDebugLog('Lend data already loaded, skipping...');
        return;
      }

      actions.addDebugLog(`Starting fetchLendData for wallet: ${walletAddress}`);
      set({ isLoading: true, error: null });

      try {
        const rpcClient = WorldChainRPCClient.getInstance();
        rpcClient.setExternalLogger((msg) => actions.addDebugLog(msg));

        actions.addDebugLog('Fetching lend positions...');
        const lendPositions = await rpcClient.getLendPositions(walletAddress) as LendPosition[];

        actions.addDebugLog(`Lend positions count: ${lendPositions.length}`);

        set({
          lendPositions,
          lendDataLoaded: true,
          isLoading: false,
          lastUpdate: new Date()
        });

        actions.addDebugLog('Lend data loaded successfully');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch lend data';
        actions.addDebugLog(`ERROR: ${errorMsg}`);
        console.error('[Store] Error fetching lend data:', error);
        set({
          error: errorMsg,
          isLoading: false
        });
      }
    },

    fetchBorrowData: async () => {
      const { walletAddress, actions, borrowDataLoaded } = get();
      if (!walletAddress) return;

      // Skip if already loaded
      if (borrowDataLoaded) {
        actions.addDebugLog('Borrow data already loaded, skipping...');
        return;
      }

      actions.addDebugLog(`Starting fetchBorrowData for wallet: ${walletAddress}`);
      set({ isLoading: true, error: null });

      try {
        const rpcClient = WorldChainRPCClient.getInstance();
        rpcClient.setExternalLogger((msg) => actions.addDebugLog(msg));

        actions.addDebugLog('Fetching borrow positions...');
        const borrowPositions = await rpcClient.getBorrowPositions(walletAddress) as BorrowPosition[];

        actions.addDebugLog(`Borrow positions count: ${borrowPositions.length}`);

        set({
          borrowPositions,
          borrowDataLoaded: true,
          isLoading: false,
          lastUpdate: new Date()
        });

        actions.addDebugLog('Borrow data loaded successfully');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch borrow data';
        actions.addDebugLog(`ERROR: ${errorMsg}`);
        console.error('[Store] Error fetching borrow data:', error);
        set({
          error: errorMsg,
          isLoading: false
        });
      }
    },

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
      const { walletAddress, activeTab } = get();
      if (!walletAddress) return;

      // Clear cache before refreshing
      const rpcClient = WorldChainRPCClient.getInstance();
      rpcClient.clearDebugLogs();

      // Reset loaded flags for the active tab
      if (activeTab === 'wallet') {
        set({ walletDataLoaded: false });
        await get().actions.fetchWalletData();
      } else if (activeTab === 'lend') {
        set({ lendDataLoaded: false });
        await get().actions.fetchLendData();
      } else if (activeTab === 'borrow') {
        set({ borrowDataLoaded: false });
        await get().actions.fetchBorrowData();
      }
    },

    clearState: () => {
      set({
        walletAddress: null,
        tokenBalances: [],
        nativeBalance: null,
        wldVaultBalance: null,
        wldSpendingBalance: null,
        lendPositions: [],
        borrowPositions: [],
        isLoading: false,
        error: null,
        lastUpdate: null,
        walletDataLoaded: false,
        lendDataLoaded: false,
        borrowDataLoaded: false
      });
    }
  }
}));
