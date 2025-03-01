// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    // Define API endpoints
    const apis = {
      flights: `${BASE_URL}/api/flights`,
      flightStatus: `${BASE_URL}/api/flight-status`,
      mobility: `${BASE_URL}/api/mobility`,
      uber: `${BASE_URL}/api/uber`,
      lyft: `${BASE_URL}/api/lyft`,
      hereMaps: `${BASE_URL}/api/here`
    };
    console.log(apis.hereMaps);

    // Fetch data from all APIs in parallel
    const responses = await Promise.all(
      Object.entries(apis).map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          const jsonData = await res.json();
          return { key, data: key === 'hereMaps' ? parseHereResponse(jsonData) : jsonData };
        } catch (error) {
          return { key, error: (error as Error).message };
        }
      })
    );

    // Format the response
    const formattedResponse = responses.reduce((acc, { key, data, error }) => {
      acc[key] = error ? { error } : data;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(formattedResponse);
  } catch (err: any) {
    console.error('Error analyzing APIs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Parses HERE Maps API response into a readable format.
 */
function parseHereResponse(hereData: any) {
  if (!hereData.routes || hereData.routes.length === 0) {
    return { error: 'No routes found' };
  }

  return hereData.routes.map((route: any) => ({
    routeId: route.id,
    summary: {
      duration: `${Math.round(route.sections[0].summary.duration / 60)} mins`,
      distance: `${(route.sections[0].summary.length / 1000).toFixed(2)} km`,
    },
    departure: {
      time: route.sections[0].departure.time,
      location: route.sections[0].departure.place.location,
    },
    arrival: {
      time: route.sections[0].arrival.time,
      location: route.sections[0].arrival.place.location,
    },
    steps: route.sections[0].actions.map((action: any) => ({
      instruction: action.instruction,
      duration: `${action.duration} sec`,
      distance: `${action.length} m`,
      direction: action.direction || 'straight',
    }))
  }));
}