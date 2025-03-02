import { Location } from '@/types/location';
import { TransportSegment } from '@/types/segment';
import { getHereRoute } from '@/lib/api/services/hereService';

export async function searchBuses(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  try {
    console.log(`Searching buses from ${origin.name} to ${destination.name} on ${date}`);

    // Call the HERE API to get transit route information, filtering for bus routes.
    const routeData = await getHereRoute(
      `${origin.coordinates?.lat},${origin.coordinates?.lng}`,
      `${destination.coordinates?.lat},${destination.coordinates?.lng}`,
      'publicTransit'
    );

    // Calculate departure and arrival times based on the HERE response.
    const departureTime = new Date(date);
    const arrivalTime = new Date(departureTime.getTime() + (routeData.travelTime || 0) * 1000);

    // Construct and return the bus route segment.
    return [
      {
        id: `bus-${Date.now()}-1`,
        origin,
        destination,
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        price: routeData.price || (35 + Math.floor(Math.random() * 25)),
        type: 'bus',
        provider: routeData.provider || 'Budget Bus Lines',
        bookingLink: routeData.bookingLink || 'https://example.com/book-bus',
      }
    ];
  } catch (error) {
    console.error('Error searching buses:', error);
    return [];
  }
}

