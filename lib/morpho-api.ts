import { ApolloClient, InMemoryCache, gql, NormalizedCacheObject } from '@apollo/client';
import { UserByAddressResponse, MarketPosition } from '@/types/morpho';

const MORPHO_API_URL = process.env.NEXT_PUBLIC_MORPHO_API_URL || 'https://api.morpho.org/graphql';
// Support multiple chains: Base, Optimism, World Chain, Ethereum
const SUPPORTED_CHAINS = [8453, 10, 480, 1]; // Base, Optimism, World Chain, Ethereum

export class MorphoAPIClient {
  private static instance: MorphoAPIClient;
  private apolloClient: ApolloClient<NormalizedCacheObject>;
  private lastFetchTime: Map<string, number> = new Map();
  private cachedData: Map<string, any> = new Map();
  private cacheDuration = parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION || '60') * 1000;

  private constructor() {
    this.apolloClient = new ApolloClient({
      uri: MORPHO_API_URL,
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-first',
        },
        query: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        },
      },
    });
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

  private chainResults: Map<number, string> = new Map();

  getChainDebugInfo(): string {
    const results: string[] = [];
    const chainNames: {[key: number]: string} = {
      8453: 'Base',
      10: 'Optimism',
      480: 'World Chain',
      1: 'Ethereum'
    };

    SUPPORTED_CHAINS.forEach(chainId => {
      const result = this.chainResults.get(chainId) || 'not queried';
      results.push(`${chainNames[chainId]}: ${result}`);
    });

    return results.join(', ');
  }

  async getUserPositions(address: string): Promise<MarketPosition[]> {
    const cacheKey = `positions-${address}`;

    // Check cache
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cachedData.get(cacheKey);
      if (cached) {
        console.log('Returning cached positions data');
        return cached;
      }
    }

    const USER_POSITIONS_QUERY = gql`
      query UserPosition($address: String!, $chainId: Int!) {
        userByAddress(chainId: $chainId, address: $address) {
          address
          marketPositions {
            market {
              uniqueKey
              lltv
              loanAsset {
                address
                symbol
                decimals
              }
              collateralAsset {
                address
                symbol
                decimals
              }
            }
            state {
              collateral
              collateralUsd
              borrowAssets
              borrowAssetsUsd
              borrowShares
              supplyAssets
              supplyAssetsUsd
              supplyShares
            }
          }
        }
      }
    `;

    try {
      // 全チェーンから並列でデータ取得
      const allPositions: MarketPosition[] = [];

      for (const chainId of SUPPORTED_CHAINS) {
        try {
          const { data } = await this.apolloClient.query<UserByAddressResponse>({
            query: USER_POSITIONS_QUERY,
            variables: {
              address: address.toLowerCase(),
              chainId,
            },
          });

          const positions = data?.userByAddress?.marketPositions || [];
          this.chainResults.set(chainId, `${positions.length} positions`);

          if (positions.length > 0) {
            console.log(`Found ${positions.length} positions on chain ${chainId}`);
            allPositions.push(...positions);
          }
        } catch (chainError) {
          const errorMsg = chainError instanceof Error ? chainError.message : 'error';
          this.chainResults.set(chainId, `error: ${errorMsg}`);
          console.error(`Error on chain ${chainId}:`, chainError);
        }
      }

      // Update cache
      this.cachedData.set(cacheKey, allPositions);
      this.lastFetchTime.set(cacheKey, Date.now());

      return allPositions;
    } catch (error) {
      console.error('Error fetching user positions:', error);

      // Return cached data if available on error
      const cached = this.cachedData.get(cacheKey);
      if (cached) {
        console.log('Returning cached data after error');
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