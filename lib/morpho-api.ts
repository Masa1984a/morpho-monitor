import { MarketPosition } from '@/types/morpho';
import { WorldChainRPCClient } from './worldchain-rpc';

export class MorphoAPIClient {
  private static instance: MorphoAPIClient;
  private worldChainClient: WorldChainRPCClient;
  private lastFetchTime: Map<string, number> = new Map();
  private cachedData: Map<string, any> = new Map();
  private cacheDuration = parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION || '60') * 1000;

  private constructor() {
    this.worldChainClient = WorldChainRPCClient.getInstance();
  }

  static getInstance(): MorphoAPIClient {
    if (!MorphoAPIClient.instance) {
      MorphoAPIClient.instance = new MorphoAPIClient();
    }
    return MorphoAPIClient.instance;
  }

  private isCacheValid(key: string): boolean {
    const lastFetch = this.lastFetchTime.get(key);
    if (!lastFetch) return false;
    return Date.now() - lastFetch < this.cacheDuration;
  }

  private debugInfo: string = '';
  private detailedDebug: string[] = [];

  getChainDebugInfo(): string {
    if (this.detailedDebug.length > 0) {
      return this.debugInfo + '\n' + this.detailedDebug.join('\n');
    }
    return this.debugInfo;
  }

  async getUserPositions(address: string): Promise<MarketPosition[]> {
    const cacheKey = `positions-${address}`;
    this.detailedDebug = [];

    // Check cache
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cachedData.get(cacheKey);
      if (cached) {
        console.log('Returning cached positions data');
        this.detailedDebug.push('Using cached data');
        return cached;
      }
    }

    try {
      console.log('Fetching positions from World Chain RPC...');
      this.detailedDebug.push(`Querying address: ${address}`);
      this.detailedDebug.push(`Morpho Blue contract: ${process.env.NEXT_PUBLIC_MORPHO_BLUE_ADDRESS || '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb'}`);

      const positions = await this.worldChainClient.getUserPositions(address);

      this.debugInfo = `World Chain: ${positions.length} positions found (via RPC)`;
      this.detailedDebug.push(`Result: ${positions.length} positions found`);

      if (positions.length === 0) {
        this.detailedDebug.push('No events found for this address on World Chain');
        this.detailedDebug.push('Check: 1) Correct address? 2) Correct chain? 3) Contract address correct?');
      }

      console.log(this.debugInfo);

      // Update cache
      this.cachedData.set(cacheKey, positions);
      this.lastFetchTime.set(cacheKey, Date.now());

      return positions;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      this.debugInfo = `World Chain: error - ${error instanceof Error ? error.message : 'unknown'}`;
      this.detailedDebug.push(`ERROR: ${error instanceof Error ? error.stack : String(error)}`);

      // Return cached data if available on error
      const cached = this.cachedData.get(cacheKey);
      if (cached) {
        console.log('Returning cached data after error');
        this.detailedDebug.push('Returned cached data after error');
        return cached;
      }

      throw error;
    }
  }

  clearCache(address?: string): void {
    if (address) {
      const cacheKey = `positions-${address}`;
      this.cachedData.delete(cacheKey);
      this.lastFetchTime.delete(cacheKey);
    } else {
      this.cachedData.clear();
      this.lastFetchTime.clear();
    }
  }
}