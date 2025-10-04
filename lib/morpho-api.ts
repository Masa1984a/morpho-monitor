import { ApolloClient, InMemoryCache, gql, NormalizedCacheObject } from '@apollo/client';
import { UserByAddressResponse, MarketPosition } from '@/types/morpho';

const MORPHO_API_URL = process.env.NEXT_PUBLIC_MORPHO_API_URL || 'https://api.morpho.org/graphql';
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453'); // Base chain

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
      const { data } = await this.apolloClient.query<UserByAddressResponse>({
        query: USER_POSITIONS_QUERY,
        variables: {
          address: address.toLowerCase(),
          chainId: CHAIN_ID,
        },
      });

      const positions = data?.userByAddress?.marketPositions || [];

      // Update cache
      this.cachedData.set(cacheKey, positions);
      this.lastFetchTime.set(cacheKey, Date.now());

      return positions;
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