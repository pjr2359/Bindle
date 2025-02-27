import { Location } from '@/types/location';
import { TransportSegment } from '@/types/segment';

export async function searchTrains(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  try {
    // Here you would integrate with a train API
    // For MVP, use mock data
    console.log(`Searching trains from ${origin.name} to ${destination.name} on ${date}`);

    // Mock train data
    return [
      {
        id: `train-${Date.now()}-1`,
        origin,
        destination,
        departureTime: new Date(date).toISOString(),
        arrivalTime: new Date(new Date(date).getTime() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours later
        price: 79 + Math.floor(Math.random() * 40),
        type: 'train',
        provider: 'Rail Express',
        bookingLink: 'https://example.com/book-train'
      }
    ];
  } catch (error) {
    console.error('Error searching trains:', error);
    return [];
  }
}