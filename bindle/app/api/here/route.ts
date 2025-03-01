// app/api/here/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const mode = searchParams.get('mode') || 'driving';

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Missing origin or destination parameter.' },
        { status: 400 }
      );
    }
    const apiKey = process.env.HERE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HERE_API_KEY is not defined.' },
        { status: 500 }
      );
    }

    // Map mode to HERE's 'car'/'pedestrian'
    const transportMode = mode === 'driving' ? 'car' : 'pedestrian';

    // Construct the HERE Routing URL
    const url = new URL('https://router.hereapi.com/v8/routes');
    url.searchParams.append('transportMode', transportMode);
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    url.searchParams.append('return', 'summary,polyline,actions,instructions');
    url.searchParams.append('apikey', apiKey);


    const response = await fetch(url.toString());
    if (!response.ok) {
      return NextResponse.json(
        { error: `HERE error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}