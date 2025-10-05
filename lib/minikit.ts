import { MiniKit } from '@worldcoin/minikit-js';

const MINI_APP_ID = process.env.NEXT_PUBLIC_MINI_APP_ID;

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
      if (typeof window !== 'undefined') {
        if (MINI_APP_ID) {
          MiniKit.install({ app_id: MINI_APP_ID });
        } else {
          MiniKit.install();
        }
      }

      // Initialize MiniKit - don't throw if not installed, just log
      console.log('MiniKit.isInstalled():', MiniKit.isInstalled());
      this.isInitialized = true;
      console.log('MiniKit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MiniKit:', error);
      // Don't throw - allow app to continue
      this.isInitialized = true;
    }
  }

  async connectWallet(): Promise<WalletAuthResult> {
    try {
      // Ensure MiniKit is initialized
      await this.initialize();

      // Request wallet connection using async command
      const nonce = `nonce-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: `wallet-connect-${Date.now()}`,
        expirationTime: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
      });

      if (finalPayload.status === 'success') {
        return {
          success: true,
          address: finalPayload.address,
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
    // より柔軟な検出ロジック
    if (typeof window === 'undefined') {
      console.log('isWorldApp: window is undefined');
      return false;
    }

    const isInstalled = MiniKit.isInstalled();
    const hasUserAgent = navigator.userAgent.includes('WorldApp');
    const hasWindowMiniKit = !!(window as any).MiniKit;

    console.log('isWorldApp checks:', {
      isInstalled,
      hasUserAgent,
      hasWindowMiniKit,
      userAgent: navigator.userAgent
    });

    // MiniKitのインストール確認 or UserAgent確認
    return isInstalled || hasUserAgent || hasWindowMiniKit;
  }
}