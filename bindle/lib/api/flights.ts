import { Location } from '@/types/location';
import { TransportSegment } from '@/types/segment';
import { formatApiDate, handleApiError, calculateDistance } from './utils';

// Skyscanner API credentials
const SKYSCANNER_API_KEY = process.env.NEXT_PUBLIC_SKYSCANNER_API_KEY || '7341b7eb14msh5966cd74fcd04d9p1b6d94jsn225947f874b8';
const SKYSCANNER_API_HOST = 'skyscanner89.p.rapidapi.com';

// Get location codes for Skyscanner API
async function getLocationCode(location: Location): Promise<{ skyId: string, entityId: string }> {
  // Simple mapping for common locations
  const cityToCode: Record<string, { skyId: string, entityId: string }> = {
    'new york': { skyId: 'NYC', entityId: '27537542' },
    'jfk': { skyId: 'JFK', entityId: '95673298' },
    'boston': { skyId: 'BOS', entityId: '27538629' },
    'chicago': { skyId: 'CHI', entityId: '27535663' },
    'san francisco': { skyId: 'SFO', entityId: '27544026' },
    'los angeles': { skyId: 'LAX', entityId: '27544850' },
    'london': { skyId: 'LON', entityId: '27544069' },
    'paris': { skyId: 'PAR', entityId: '27539733' },
    'ithaca': { skyId: 'ITH', entityId: '27545475' },
    'athens': { skyId: 'ATH', entityId: '27539604' }
  };

  // Try to find by city name
  const cityName = location.name.toLowerCase().split(',')[0];
  if (cityToCode[cityName]) {
    return cityToCode[cityName];
  }

  // Default fallback
  return { skyId: 'NYC', entityId: '27537542' };
}

export async function searchFlights(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  try {
    // Get location codes
    const originCodes = await getLocationCode(origin);
    const destinationCodes = await getLocationCode(destination);

    // Format date for API (YYYY-MM-DD)
    const formattedDate = formatApiDate(date);

    console.log(`Searching flights from ${origin.name} to ${destination.name} on ${formattedDate}`);

    // Build the query URL
    const url = new URL('https://skyscanner89.p.rapidapi.com/flights/one-way/list');

    // Add required query parameters
    url.searchParams.append('origin', originCodes.skyId);
    url.searchParams.append('originId', originCodes.entityId);
    url.searchParams.append('destination', destinationCodes.skyId);
    url.searchParams.append('destinationId', destinationCodes.entityId);
    url.searchParams.append('date', formattedDate);
    url.searchParams.append('adults', '1');
    url.searchParams.append('cabinClass', 'economy');
    url.searchParams.append('currency', 'USD');
    url.searchParams.append('locale', 'en-US');
    url.searchParams.append('market', 'US');

    // Make API request

    let response;
    if (typeof window !== 'undefined') {
      // Client-side: use the proxy to avoid CORS
      const baseUrl = window.location.origin;
      const proxyUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(url.toString())}`;
      response = await fetch(proxyUrl);
    } else {
      // Server-side: make the request directly
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': SKYSCANNER_API_HOST,
          'X-RapidAPI-Key': SKYSCANNER_API_KEY,
        }
      });
    }

    if (!response.ok) {
      throw new Error(`Skyscanner API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform response to our app's format
    return transformSkyscannerResults(data, origin, destination);
  } catch (error) {
    handleApiError(error, 'Skyscanner');

    // Fallback to mock data
    return getMockFlightData(origin, destination, date);
  }
}

// Transform Skyscanner data to our app's format
function transformSkyscannerResults(skyscannerData: any, origin: Location, destination: Location): TransportSegment[] {
  const segments: TransportSegment[] = [];

  try {
    // Check if we have valid data
    if (!skyscannerData.content?.results?.itineraries) {
      return getMockFlightData(origin, destination, new Date().toISOString());
    }

    // Process each itinerary
    Object.values(skyscannerData.content.results.itineraries).forEach((itinerary: any, index: number) => {
      if (!itinerary.legs || !itinerary.pricingOptions || itinerary.legs.length === 0) {
        return;
      }

      const leg = itinerary.legs[0];
      const pricing = itinerary.pricingOptions[0];

      if (!leg || !pricing) {
        return;
      }

      // Create segment
      const segment: TransportSegment = {
        id: `flight-${Date.now()}-${index}`,
        origin: origin,
        destination: destination,
        departureTime: leg.departure,
        arrivalTime: leg.arrival,
        price: pricing.price.amount,
        type: 'flight',
        provider: leg.carriers && leg.carriers.length > 0 ? leg.carriers[0].name : 'Unknown Airline',
        bookingLink: pricing.items && pricing.items.length > 0 ? pricing.items[0].deepLink : 'https://www.skyscanner.com'
      };

      segments.push(segment);
    });

    return segments.length > 0 ? segments : getMockFlightData(origin, destination, new Date().toISOString());
  } catch (error) {
    console.error('Error transforming Skyscanner results:', error);
    return getMockFlightData(origin, destination, new Date().toISOString());
  }
}

// Mock data function (as fallback)
function getMockFlightData(
  origin: Location,
  destination: Location,
  date: string
): TransportSegment[] {
  console.log(`Using mock flight data from ${origin.name} to ${destination.name} on ${date}`);

  // Calculate more realistic travel times based on distance
  let flightHours = 2; // Default

  if (origin.coordinates && destination.coordinates) {
    const distance = calculateDistance(
      origin.coordinates.lat,
      origin.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );

    // Rough estimation: 500 km/h average speed + 1 hour for boarding/taxiing
    flightHours = Math.max(1, Math.round(distance / 500) + 1);
  }

  const departureTime = new Date(date);

  return [
    {
      id: `flight-${Date.now()}-1`,
      origin,
      destination,
      departureTime: departureTime.toISOString(),
      arrivalTime: new Date(departureTime.getTime() + flightHours * 60 * 60 * 1000).toISOString(),
      price: 199 + Math.floor(Math.random() * 200),
      type: 'flight',
      provider: 'Mock Airlines',
      bookingLink: 'https://example.com/book'
    },
    {
      id: `flight-${Date.now()}-2`,
      origin,
      destination,
      departureTime: new Date(departureTime.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      arrivalTime: new Date(departureTime.getTime() + (6 + flightHours) * 60 * 60 * 1000).toISOString(),
      price: 149 + Math.floor(Math.random() * 150),
      type: 'flight',
      provider: 'Budget Air',
      bookingLink: 'https://example.com/book'
    }
  ];
}