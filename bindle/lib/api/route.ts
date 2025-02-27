import { NextRequest, NextResponse } from 'next/server';
import { findRoutes } from '@/lib/routing/engine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const originId = searchParams.get('originId');
    const destinationId = searchParams.get('destinationId');
    const departureDate = searchParams.get('departureDate');
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const maxDuration = searchParams.get('maxDuration') ? parseFloat(searchParams.get('maxDuration')!) : undefined;

    if (!originId || !destinationId || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const routes = await findRoutes(
      originId,
      destinationId,
      departureDate,
      maxPrice,
      maxDuration
    );

    return NextResponse.json({ routes });
  } catch (error) {
    console.error('Error searching routes:', error);
    return NextResponse.json(
      { error: 'Failed to search routes' },
      { status: 500 }
    );
  }
}