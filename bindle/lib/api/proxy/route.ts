// Updated proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    const apiKey = process.env.NEXT_PUBLIC_SKYSCANNER_API_KEY;

    if (!url || !url.startsWith('https://skyscanner89.p.rapidapi.com/')) {
      return NextResponse.json(
        { error: 'Invalid URL parameter' },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com',
        'X-RapidAPI-Key': apiKey || '',
      },
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}