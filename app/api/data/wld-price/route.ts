import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Build query parameters
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const queryString = params.toString();
    const apiUrl = `https://morpho-analyst.vercel.app/api/data/wld-price${queryString ? `?${queryString}` : ''}`;

    // Get auth token from environment variable
    const authToken = process.env.MORPHO_API_SECRET;
    if (!authToken) {
      console.error('MORPHO_API_SECRET is not set');
      return NextResponse.json(
        { error: 'API token not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching WLD price data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WLD price data' },
      { status: 500 }
    );
  }
}
