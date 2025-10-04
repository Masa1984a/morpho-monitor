import { MiniKit } from '@worldcoin/minikit-js';

export interface WalletAuthResult {
  success: boolean;
  address?: string;
  error?: string;
}

export class MiniKitService {
  private static instance: MiniKitService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MiniKitService {
    if (!MiniKitService.instance) {
      MiniKitService.instance = new MiniKitService();
    }
    return MiniKitService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize MiniKit
      if (!MiniKit.isInstalled()) {
        throw new Error('This app must be opened in World App');
      }

      this.isInitialized = true;
      console.log('MiniKit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MiniKit:', error);
      throw error;
    }
  }

  async connectWallet(): Promise<WalletAuthResult> {
    try {
      // Ensure MiniKit is initialized
      await this.initialize();

      // Request wallet connection
      const result = await MiniKit.commands.walletAuth({
        requestId: `wallet-connect-${Date.now()}`,
        description: 'Connect your wallet to view your Morpho positions',
        expirationTime: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
      });

      if (result.finalPayload?.status === 'success') {
        const address = result.finalPayload.address;
        return {
          success: true,
          address,
        };
      }

      return {
        success: false,
        error: 'Wallet connection denied or failed',
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      };
    }
  }

  isWorldApp(): boolean {
    return MiniKit.isInstalled();
  }
}