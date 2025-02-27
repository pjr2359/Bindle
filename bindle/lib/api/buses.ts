import { Location } from '@/types/location';
import { TransportSegment } from '@/types/segment';

export async function searchBuses(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  try {
    // Here you would integrate with a bus API like the FlixBus API
    // For MVP, use mock data
    console.log(`Searching buses from ${origin.name} to ${destination.name} on ${date}`);

    // Mock bus data
    return [
      {
        id: `bus-${Date.now()}-1`,
        origin,
        destination,
        departureTime: new Date(date).toISOString(),
        arrivalTime: new Date(new Date(date).getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours later
        price: 35 + Math.floor(Math.random() * 25),
        type: 'bus',
        provider: 'Budget Bus Lines',
        bookingLink: 'https://example.com/book-bus'
      }
    ];
  } catch (error) {
    console.error('Error searching buses:', error);
    return [];
  }
}