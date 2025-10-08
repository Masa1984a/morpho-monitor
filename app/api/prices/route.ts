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
}

interface UnifiedPriceResponse {
  WLD?: number;
  USDC?: number;
  WBTC?: number;
  WETH?: number;
}

export async function GET(request: Request) {
  try {
    const prices: UnifiedPriceResponse = {};

    // Fetch WLD and USDC from World Coin API
    try {
      const worldCoinResponse = await fetch(
        'https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD,USDC&fiatCurrencies=USD',
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        }
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

    // Fetch WBTC (Bitcoin) and WETH (Ethereum) from CoinGecko
    try {
      const coinGeckoResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        }
      );

      if (coinGeckoResponse.ok) {
        const data: CoinGeckoPriceResponse = await coinGeckoResponse.json();

        if (data.bitcoin?.usd) {
          prices.WBTC = data.bitcoin.usd;
        }

        if (data.ethereum?.usd) {
          prices.WETH = data.ethereum.usd;
        }
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
