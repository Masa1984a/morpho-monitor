import { NextRequest, NextResponse } from 'next/server';

const BLOG_API_BASE_URL = 'https://cts-blog-three.vercel.app';
const BLOG_API_TOKEN = process.env.BLOG_API_TOKEN;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if token is configured
    if (!BLOG_API_TOKEN) {
      return NextResponse.json(
        { error: 'Blog API token not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const lang = searchParams.get('lang') || 'en';
    const { id } = await params;

    const response = await fetch(
      `${BLOG_API_BASE_URL}/api/public/posts/${id}?lang=${lang}`,
      {
        headers: {
          'Authorization': `Bearer ${BLOG_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch blog post' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
