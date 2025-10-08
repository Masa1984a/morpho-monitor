import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://morpho-pyjvb3f9q-masanori-yoshidas-projects.vercel.app';
const BEARER_TOKEN = 'CTS_TOKENS_20251008';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    // Validate symbol
    const validSymbols = ['WLD', 'USDC', 'WBTC', 'WETH'];
    if (!validSymbols.includes(symbol.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid symbol' },
        { status: 400 }
      );
    }

    // Fetch from external API
    const response = await fetch(
      `${API_BASE_URL}/api/assets/${symbol.toUpperCase()}/summary`,
      {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
        },
        // Add cache control
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Crypto API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch crypto data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
