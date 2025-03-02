// app/api/test-openai-flights/route.ts
import { NextResponse } from 'next/server';
import { searchFlightsWithAI } from '@/lib/ai/openai-flights';

export async function GET() {
  try {
    const testOrigin = {
      id: 'nyc',
      name: 'New York, NY, United States',
      type: 'city' as const,
      coordinates: { lat: 40.7128, lng: -74.0060 }
    };

    const testDestination = {
      id: 'lax',
      name: 'Los Angeles, CA, United States',
      type: 'city' as const,
      coordinates: { lat: 34.0522, lng: -118.2437 }
    };

    // Use tomorrow's date for testing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0];

    console.log(`Testing AI flight search from ${testOrigin.name} to ${testDestination.name} on ${testDate}`);

    const results = await searchFlightsWithAI(testOrigin, testDestination, testDate);

    return NextResponse.json({
      success: true,
      origin: testOrigin.name,
      destination: testDestination.name,
      date: testDate,
      flightsCount: results.length,
      results
    });
  } catch (error) {
    console.error('Error in OpenAI flight test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}