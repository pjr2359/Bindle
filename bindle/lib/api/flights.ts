import { Location } from '@/types/location';
import { TransportSegment } from '@/types/segment';

// Use a free flight API like AviationStack or a mock for development
const AVIATION_API_KEY = process.env.AVIATION_API_KEY;

export async function searchFlights(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  // For MVP, you can start with mock data
  try {
    // Uncomment when you have a working API key
    // const response = await fetch(
    //   `https://api.aviationstack.com/v1/flights?access_key=${AVIATION_API_KEY}&dep_iata=${origin.id}&arr_iata=${destination.id}`
    // );
    // const data = await response.json();

    // For now, return mock data
    console.log(`Searching flights from ${origin.name} to ${destination.name} on ${date}`);

    // Mock flight data
    return [
      {
        id: `flight-${Date.now()}-1`,
        origin,
        destination,
        departureTime: new Date(date).toISOString(),
        arrivalTime: new Date(new Date(date).getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
        price: 199 + Math.floor(Math.random() * 200),
        type: 'flight',
        provider: 'Mock Airlines',
        bookingLink: 'https://example.com/book'
      },
      {
        id: `flight-${Date.now()}-2`,
        origin,
        destination,
        departureTime: new Date(new Date(date).getTime() + 6 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(new Date(date).getTime() + 10 * 60 * 60 * 1000).toISOString(),
        price: 149 + Math.floor(Math.random() * 150),
        type: 'flight',
        provider: 'Budget Air',
        bookingLink: 'https://example.com/book'
      }
    ];
  } catch (error) {
    console.error('Error searching flights:', error);
    return [];
  }
}