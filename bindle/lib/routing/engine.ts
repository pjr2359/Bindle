import { TransportSegment } from '@/types/segment';
import { Location } from '@/types/location';
import { Journey } from '@/types/route';
import { searchFlights } from '@/lib/api/flights';
import { searchTrains } from '@/lib/api/trains';
import { searchBuses } from '@/lib/api/buses';
import { buildRoutingGraph, calculateTransferTime } from './graph';
import { findNearbyTransportLocations, getLocationById } from '@/lib/utils/geo';

// Find all possible routes between origin and destination
export async function findRoutes(
  originId: string,
  destinationId: string,
  departureDate: string,
  maxPrice?: number,
  maxDuration?: number
): Promise<Journey[]> {
  // Step 1: Get location objects
  const originLocation = getLocationById(originId);
  const destinationLocation = getLocationById(destinationId);

  if (!originLocation || !destinationLocation) {
    throw new Error('Invalid origin or destination');
  }

  // Step 2: Find nearby transport locations
  const originTransportLocations = await findNearbyTransportLocations(originLocation.name);
  const destinationTransportLocations = await findNearbyTransportLocations(destinationLocation.name);

  // Add the main locations to the lists
  originTransportLocations.unshift(originLocation);
  destinationTransportLocations.unshift(destinationLocation);

  // Step 3: Search for all direct segments between all possible origins and destinations
  const directSegments: TransportSegment[] = [];

  // This would be parallelized in a production app
  for (const origin of originTransportLocations) {
    for (const destination of destinationTransportLocations) {
      // Skip if origin and destination are the same
      if (origin.id === destination.id) continue;

      // Get flights
      const flights = await searchFlights(origin, destination, departureDate);
      directSegments.push(...flights);

      // Get trains
      const trains = await searchTrains(origin, destination, departureDate);
      directSegments.push(...trains);

      // Get buses
      const buses = await searchBuses(origin, destination, departureDate);
      directSegments.push(...buses);
    }
  }

  // Step 4: Build multi-modal routes (simplified for MVP)
  const journeys: Journey[] = [];

  // First, add all direct routes
  const directRoutes = directSegments.filter(
    segment =>
      originTransportLocations.some(loc => loc.id === segment.origin.id) &&
      destinationTransportLocations.some(loc => loc.id === segment.destination.id)
  );

  for (const segment of directRoutes) {
    const departureTime = new Date(segment.departureTime);
    const arrivalTime = new Date(segment.arrivalTime);
    const duration = (arrivalTime.getTime() - departureTime.getTime()) / (60 * 1000); // in minutes

    journeys.push({
      id: `journey-${Date.now()}-${segment.id}`,
      segments: [segment],
      totalPrice: segment.price,
      totalDuration: duration,
      transfers: 0
    });
  }

  // For MVP, only consider 1-hop routes for simplicity
  // In a real app, you'd use a more sophisticated algorithm like Dijkstra's
  for (const segment1 of directSegments) {
    for (const segment2 of directSegments) {
      // Check if segments can be connected
      if (segment1.destination.id === segment2.origin.id) {
        const segment1Arrival = new Date(segment1.arrivalTime);
        const segment2Departure = new Date(segment2.departureTime);

        // Check if there's enough time for the connection
        const transferTime = calculateTransferTime(segment1.destination, segment2.origin);
        const connectionTime = (segment2Departure.getTime() - segment1Arrival.getTime()) / (60 * 1000); // in minutes

        if (connectionTime >= transferTime) {
          // Check if the destination is valid
          if (destinationTransportLocations.some(loc => loc.id === segment2.destination.id)) {
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

  // Sort journeys by price
  return journeys.sort((a, b) => a.totalPrice - b.totalPrice);
}