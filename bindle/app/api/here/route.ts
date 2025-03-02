// app/api/here/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getHereRoute } from '@/lib/api/services/hereService';

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

    const data = await getHereRoute(origin, destination, mode);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}