import { NextResponse } from 'next/server';

interface WorldCoinPriceResponse {
  result: {
    prices: {
      [crypto: string]: {
        [fiat: string]: {
          asset: string;
          amount: string;
          decimals: number;
          symbol: string;
        };
      };
    };
  };
}

interface CoinGeckoPriceResponse {
  bitcoin?: { usd: number };
  ethereum?: { usd: number };
  solana?: { usd: number };
  dogecoin?: { usd: number };
  ripple?: { usd: number };
  sui?: { usd: number };
  stellar?: { usd: number };
  litecoin?: { usd: number };
  'shiba-inu'?: { usd: number };
  cardano?: { usd: number };
  chainlink?: { usd: number };
  // Note: ORO, ORB, and oXAUt might not be available on CoinGecko
}

interface UnifiedPriceResponse {
  WLD?: number;
  USDC?: number;
  WBTC?: number;
  WETH?: number;
  // Universal Protocol Assets
  uSOL?: number;
  uDOGE?: number;
  uXRP?: number;
  uSUI?: number;
  uXLM?: number;
  uLTC?: number;
  uSHIB?: number;
  uADA?: number;
  uLINK?: number;
  // Other Tokens
  ORO?: number;
  ORB?: number;
  oXAUt?: number;
}

// Fetch with timeout and retry logic
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000,
  retries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying (exponential backoff: 100ms, 200ms, 400ms...)
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Max retries exceeded');
}

export async function GET(request: Request) {
  try {
    const prices: UnifiedPriceResponse = {};

    // Fetch WLD and USDC from World Coin API
    try {
      const worldCoinResponse = await fetchWithTimeout(
        'https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD,USDC&fiatCurrencies=USD',
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
        5000, // 5 second timeout
        2     // 2 retries
      );

      if (worldCoinResponse.ok) {
        const data: WorldCoinPriceResponse = await worldCoinResponse.json();

        // Parse WLD price
        if (data.result?.prices?.WLD?.USD) {
          const wldAmount = data.result.prices.WLD.USD.amount;
          const wldDecimals = data.result.prices.WLD.USD.decimals;
          prices.WLD = parseFloat(wldAmount) / Math.pow(10, wldDecimals);
        }

        // Parse USDC price
        if (data.result?.prices?.USDC?.USD) {
          const usdcAmount = data.result.prices.USDC.USD.amount;
          const usdcDecimals = data.result.prices.USDC.USD.decimals;
          prices.USDC = parseFloat(usdcAmount) / Math.pow(10, usdcDecimals);
        }
      }
    } catch (error) {
      console.error('World Coin API error:', error);
    }

    // Fetch crypto prices from CoinGecko
    try {
      const coinIds = [
        'bitcoin',
        'ethereum',
        'solana',
        'dogecoin',
        'ripple',
        'sui',
        'stellar',
        'litecoin',
        'shiba-inu',
        'cardano',
        'chainlink'
      ].join(',');

      const coinGeckoResponse = await fetchWithTimeout(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
        5000, // 5 second timeout
        2     // 2 retries
      );

      if (coinGeckoResponse.ok) {
        const data: CoinGeckoPriceResponse = await coinGeckoResponse.json();

        // Main tokens
        if (data.bitcoin?.usd) prices.WBTC = data.bitcoin.usd;
        if (data.ethereum?.usd) prices.WETH = data.ethereum.usd;

        // Universal Protocol Assets (mapped to their underlying assets)
        if (data.solana?.usd) prices.uSOL = data.solana.usd;
        if (data.dogecoin?.usd) prices.uDOGE = data.dogecoin.usd;
        if (data.ripple?.usd) prices.uXRP = data.ripple.usd;
        if (data.sui?.usd) prices.uSUI = data.sui.usd;
        if (data.stellar?.usd) prices.uXLM = data.stellar.usd;
        if (data.litecoin?.usd) prices.uLTC = data.litecoin.usd;
        if (data['shiba-inu']?.usd) prices.uSHIB = data['shiba-inu'].usd;
        if (data.cardano?.usd) prices.uADA = data.cardano.usd;
        if (data.chainlink?.usd) prices.uLINK = data.chainlink.usd;

        // Note: ORO, ORB, and oXAUt prices are not available from CoinGecko
        // These would need to be fetched from a DEX or other source
      }
    } catch (error) {
      console.error('CoinGecko API error:', error);
    }

    // Return unified prices
    return NextResponse.json(prices, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error in prices API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
