// lib/routing/engine.ts
import { TransportSegment } from '@/types/segment';
import { Location } from '@/types/location';
import { Journey } from '@/types/route';
import { searchFlights } from '@/lib/api/flights';
import { searchTrains } from '@/lib/api/trains';
import { searchBuses } from '@/lib/api/buses';
import { calculateTransferTime } from './graph';
import { findNearbyTransportLocations, getLocationById } from '@/lib/utils/geo';
import { searchWalks } from '../api/walking';
import { calculateDistance } from '../api/utils';

// Configuration for transport mode selection based on distance
const DISTANCE_THRESHOLDS = {
  WALKING_MAX: 10, // km - only consider walking for very short distances
  BUS_MAX: 300,    // km - buses typically for shorter journeys
  TRAIN_MAX: 1000, // km - trains for medium distances
  // flights for anything longer
};

/**
 * Find all possible routes between origin and destination with optimization
 * to reduce unnecessary API calls
 */
export async function findRoutes(
  originId: string,
  destinationId: string,
  departureDate: string,
  maxPrice?: number,
  maxDuration?: number
): Promise<Journey[]> {
  const routeSearchLabel = `routeSearch-${Date.now()}`;
  console.time(routeSearchLabel);

  // Step 1: Get location objects
  const originLocation = await getLocationById(originId);
  const destinationLocation = await getLocationById(destinationId);

  if (!originLocation || !destinationLocation) {
    throw new Error('Invalid origin or destination');
  }

  // Calculate the direct distance between locations
  let directDistance: number | undefined;

  if (originLocation.coordinates && destinationLocation.coordinates) {
    directDistance = calculateDistance(
      originLocation.coordinates.lat,
      originLocation.coordinates.lng,
      destinationLocation.coordinates.lat,
      destinationLocation.coordinates.lng
    );
    console.log(`Direct distance between ${originLocation.name} and ${destinationLocation.name}: ${directDistance}km`);
  }

  // Step 2: Determine which transport modes to search based on distance
  const searchModes: Array<'walk' | 'bus' | 'train' | 'flight'> = [];

  if (!directDistance || directDistance <= DISTANCE_THRESHOLDS.WALKING_MAX) {
    searchModes.push('walk');
  }

  if (!directDistance || directDistance <= DISTANCE_THRESHOLDS.BUS_MAX) {
    searchModes.push('bus');
  }

  if (!directDistance || directDistance <= DISTANCE_THRESHOLDS.TRAIN_MAX) {
    searchModes.push('train');
  }

  if (!directDistance || directDistance > DISTANCE_THRESHOLDS.BUS_MAX) {
    searchModes.push('flight');
  }

  console.log(`Selected transport modes for search: ${searchModes.join(', ')}`);

  // Step 3: Origin/destination locations for search
  // City → include city + nearby airports (from API; see findNearbyTransportLocations). Airport → only that airport.
  const MAX_CITY_AIRPORTS = 6;

  const originTransportLocations = [originLocation];
  if (originLocation.type === 'city') {
    const nearbyOrigin = await findNearbyTransportLocations(originLocation.name);
    originTransportLocations.push(...nearbyOrigin);
  }
  const limitedOriginLocations = originTransportLocations.slice(0, MAX_CITY_AIRPORTS);

  const destinationTransportLocations = [destinationLocation];
  if (destinationLocation.type === 'city') {
    const nearbyDest = await findNearbyTransportLocations(destinationLocation.name);
    destinationTransportLocations.push(...nearbyDest);
  }
  const limitedDestinationLocations = destinationTransportLocations.slice(0, MAX_CITY_AIRPORTS);

  console.log(`Using ${limitedOriginLocations.length} origin locations and ${limitedDestinationLocations.length} destination locations`);

  // Step 4: Search for direct segments based on selected transport modes
  const directSegments: TransportSegment[] = [];
  const searchPromises: Promise<void>[] = [];

  // Always search for walking between main origin and destination if distance is short enough
  if (searchModes.includes('walk')) {
    searchPromises.push(
      searchWalks(originLocation, destinationLocation, departureDate)
        .then(segments => {
          directSegments.push(...segments);
        })
    );
  }

  // For flights we only care about airport↔airport pairs (city codes like NYC/LON
  // tend to produce duplicate results for the same underlying flight).
  const flightOriginLocations =
    limitedOriginLocations.filter(loc => loc.type === 'airport') || [];
  const flightDestinationLocations =
    limitedDestinationLocations.filter(loc => loc.type === 'airport') || [];

  // Collect pairs per mode so we can control concurrency, especially for flights (Amadeus)
  const flightPairs: [Location, Location][] = [];
  const trainPairs: [Location, Location][] = [];
  const busPairs: [Location, Location][] = [];

  // Flights: airport-only pairs
  if (searchModes.includes('flight')) {
    for (const origin of flightOriginLocations) {
      for (const destination of flightDestinationLocations) {
        if (origin.id === destination.id) continue;

        let pairDistance: number | undefined;
        if (origin.coordinates && destination.coordinates) {
          pairDistance = calculateDistance(
            origin.coordinates.lat,
            origin.coordinates.lng,
            destination.coordinates.lat,
            destination.coordinates.lng
          );
        }

        if (!pairDistance || pairDistance > DISTANCE_THRESHOLDS.BUS_MAX) {
          flightPairs.push([origin, destination]);
        }
      }
    }
  }

  // Trains / buses: use city + station/airport locations as before
  for (const origin of limitedOriginLocations) {
    for (const destination of limitedDestinationLocations) {
      if (origin.id === destination.id) continue;

      let pairDistance: number | undefined;
      if (origin.coordinates && destination.coordinates) {
        pairDistance = calculateDistance(
          origin.coordinates.lat,
          origin.coordinates.lng,
          destination.coordinates.lat,
          destination.coordinates.lng
        );
      }

      if (searchModes.includes('train') && (!pairDistance || pairDistance <= DISTANCE_THRESHOLDS.TRAIN_MAX)) {
        trainPairs.push([origin, destination]);
      }
      if (searchModes.includes('bus') && (!pairDistance || pairDistance <= DISTANCE_THRESHOLDS.BUS_MAX)) {
        busPairs.push([origin, destination]);
      }
    }
  }

  // Run flight searches in small batches to stay under Amadeus rate limits
  const FLIGHT_BATCH_SIZE = 3;
  for (let i = 0; i < flightPairs.length; i += FLIGHT_BATCH_SIZE) {
    const batch = flightPairs.slice(i, i + FLIGHT_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(([o, d]) => searchFlights(o, d, departureDate))
    );
    batchResults.forEach(segments => directSegments.push(...segments));
  }

  // Trains and buses (no shared rate limit with Amadeus) can run in parallel
  searchPromises.push(
    ...trainPairs.map(([o, d]) =>
      searchTrains(o, d, departureDate).then(segments => {
        directSegments.push(...segments);
      })
    ),
    ...busPairs.map(([o, d]) =>
      searchBuses(o, d, departureDate).then(segments => {
        directSegments.push(...segments);
      })
    )
  );

  await Promise.all(searchPromises);
  console.log(`Found ${directSegments.length} direct segments`);

  // Step 5: Build multi-modal routes
  const journeys: Journey[] = [];

  // First, add all direct routes
  const directRoutes = directSegments.filter(
    segment =>
      limitedOriginLocations.some(loc => loc.id === segment.origin.id) &&
      limitedDestinationLocations.some(loc => loc.id === segment.destination.id)
  );

  for (const segment of directRoutes) {
    const departureTime = new Date(segment.departureTime);
    const arrivalTime = new Date(segment.arrivalTime);
    const duration = (arrivalTime.getTime() - departureTime.getTime()) / (60 * 1000); // in minutes

    // Skip if exceeds max duration
    if (maxDuration && duration > maxDuration * 60) continue;

    // Skip if exceeds max price
    if (maxPrice && segment.price > maxPrice) continue;

    journeys.push({
      id: `journey-${Date.now()}-${segment.id}`,
      segments: [segment],
      totalPrice: segment.price,
      totalDuration: duration,
      transfers: 0
    });
  }

  // Limit the number of connections we'll try to consider to avoid performance problems
  const MAX_CONNECTIONS_TO_CHECK = 1000;
  let connectionsChecked = 0;

  // For MVP, only consider 1-hop routes for simplicity
  // To improve: use a more sophisticated algorithm like Dijkstra's or A*
  for (const segment1 of directSegments) {
    // Early exit if we've checked too many connections already
    if (connectionsChecked >= MAX_CONNECTIONS_TO_CHECK) break;

    for (const segment2 of directSegments) {
      // Increment counter and check limit
      connectionsChecked++;
      if (connectionsChecked >= MAX_CONNECTIONS_TO_CHECK) break;

      // Check if segments can be connected
      if (segment1.destination.id === segment2.origin.id) {
        const segment1Arrival = new Date(segment1.arrivalTime);
        const segment2Departure = new Date(segment2.departureTime);

        // Check if there's enough time for the connection
        const transferTime = calculateTransferTime(segment1.destination, segment2.origin);
        const connectionTime = (segment2Departure.getTime() - segment1Arrival.getTime()) / (60 * 1000); // in minutes

        if (connectionTime >= transferTime) {
          // Check if the destination is valid
          if (limitedDestinationLocations.some(loc => loc.id === segment2.destination.id)) {
            const departureTime = new Date(segment1.departureTime);
            const arrivalTime = new Date(segment2.arrivalTime);
            const duration = (arrivalTime.getTime() - departureTime.getTime()) / (60 * 1000); // in minutes

            // Skip if exceeds max duration
            if (maxDuration && duration > maxDuration * 60) continue;

            const totalPrice = segment1.price + segment2.price;

            // Skip if exceeds max price
            if (maxPrice && totalPrice > maxPrice) continue;

            journeys.push({
              id: `journey-${Date.now()}-${segment1.id}-${segment2.id}`,
              segments: [segment1, segment2],
              totalPrice,
              totalDuration: duration,
              transfers: 1
            });
          }
        }
      }
    }
  }

  // Dedupe: same logical flight (route, price, time, carrier) from multiple OD pairs
  const seen = new Set<string>();
  const uniqueJourneys = journeys.filter((j) => {
    const seg = j.segments[0];
    const originCode = seg.origin.skyId ?? seg.origin.id ?? '';
    const destCode = seg.destination.skyId ?? seg.destination.id ?? '';
    const depNorm = seg.departureTime.slice(0, 16);
    const arrNorm = seg.arrivalTime.slice(0, 16);
    const key = `${originCode}-${destCode}-${j.totalPrice}-${Math.round(j.totalDuration)}-${depNorm}-${arrNorm}-${seg.provider}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by price, then by duration (fastest first when same price)
  const sortedJourneys = uniqueJourneys.sort(
    (a, b) => a.totalPrice - b.totalPrice || a.totalDuration - b.totalDuration
  );

  // Cap for display (avoid huge result sets)
  const MAX_JOURNEYS = 50;
  const capped = sortedJourneys.slice(0, MAX_JOURNEYS);

  console.timeEnd(routeSearchLabel);
  console.log(`Found ${sortedJourneys.length} unique journeys (showing ${capped.length})`);

  return capped;
}