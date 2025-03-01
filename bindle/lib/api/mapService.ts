// lib/mapService.ts
export type TransportMode = 'driving' | 'walking';

export interface HereRouteStep {
  instruction: string;
  distance: number;    // distance in meters for the step
  travelTime: number;  // duration in seconds for the step
}

export interface HereRouteResponse {
  distance: number;
  travelTime: number;
  steps: HereRouteStep[];
}

/**
 * Calls our local Next.js API route, which in turn fetches the HERE route data.
 * @param origin - "lat,lon"
 * @param destination - "lat,lon"
 * @param mode - 'driving' or 'walking'
 */
export async function getHereRoute(
  origin: string,
  destination: string,
  mode: TransportMode = 'driving'
): Promise<HereRouteResponse> {
  // Construct the URL for our local Next.js route
  // e.g., http://localhost:3000/api/here?origin=...&destination=...&mode=...
  const localUrl = new URL('http://localhost:3000/api/here')
  localUrl.searchParams.append('origin', origin);
  localUrl.searchParams.append('destination', destination);
  localUrl.searchParams.append('mode', mode);

  const response = await fetch(localUrl.toString());
  if (!response.ok) {
    throw new Error(`Error fetching local route: ${response.statusText}`);
  }

  // The data returned is the raw HERE JSON. We'll parse it to create a simpler structure.
  const data = await response.json();

  // Validate data (similar checks to before)
  if (
    !data.routes ||
    !data.routes.length ||
    !data.routes[0].sections ||
    !data.routes[0].sections.length
  ) {
    throw new Error('No route found');
  }

  const section = data.routes[0].sections[0];
  const summary = section.summary;

  // Convert actions to a typed array
  const steps: HereRouteStep[] = section.actions.map((action: any) => ({
    instruction: action.instruction,
    distance: action.length,
    travelTime: action.travelTime || 0,
  }));

  return {
    distance: summary.length,
    travelTime: summary.baseDuration,
    steps,
  };
}