// Server-side location autocomplete; keeps Amadeus credentials out of the client
import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/lib/utils/geo';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }
  try {
    const results = await searchLocations(q.trim());
    return NextResponse.json(results);
  } catch (error) {
    console.error('Locations API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
