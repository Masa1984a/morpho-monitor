// Application State Types for Zustand Store

import { TokenBalance, NativeBalance, WLDVaultBalance, WLDSpendingBalance } from './wallet';
import { LendPosition, BorrowPosition } from './morpho';

export type TabType = 'wallet' | 'lend' | 'borrow' | 'analysis';

export interface AppState {
  // Wallet connection
  walletAddress: string | null;
  isConnecting: boolean;

  // Data
  tokenBalances: TokenBalance[];
  nativeBalance: NativeBalance | null;
  wldVaultBalance: WLDVaultBalance | null;      // Locked WLD in Vault (OP + World Chain)
  wldSpendingBalance: WLDSpendingBalance | null; // Liquid WLD (OP + World Chain)
  lendPositions: LendPosition[];
  borrowPositions: BorrowPosition[];

  // UI State
  isLoading: boolean;
  lendLoading: boolean;
  error: string | null;
  activeTab: TabType;
  lastUpdate: Date | null;

  // Tab-specific loading states
  walletDataLoaded: boolean;
  lendDataLoaded: boolean;
  borrowDataLoaded: boolean;

  // Debug
  debugLogs: string[];

  // Actions
  actions: {
    setWalletAddress: (address: string | null) => void;
    setActiveTab: (tab: TabType) => void;
    fetchWalletData: () => Promise<void>;
    fetchLendData: () => Promise<void>;
    fetchBorrowData: () => Promise<void>;
    fetchDashboardData: () => Promise<void>;
    refreshData: () => Promise<void>;
    clearState: () => void;
    addDebugLog: (log: string) => void;
    clearDebugLogs: () => void;
  };
}
