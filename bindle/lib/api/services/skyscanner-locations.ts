// lib/api/skyscanner-locations.ts
import { Location } from '@/types/location';
import { handleApiError } from '../utils';

// Skyscanner API credentials
const SKYSCANNER_API_HOST = 'skyscanner89.p.rapidapi.com';
const SKYSCANNER_API_KEY = process.env.SKYSCANNER_API_KEY;

// Types for Skyscanner auto-complete API response
interface SkyscannerLocation {
  entityId: string;
  name: string;
  countryId: string;
  countryName: string;
  cityId?: string;
  cityName?: string;
  iata?: string;
  type: string;
  centroidCoordinates?: {
    latitude: number;
    longitude: number;
  };
  hierarchy?: {
    name: string;
    iata: string;
    id: string;
  }[];
  relevantFlightParams?: {
    skyId: string;
    entityId: string;
  };
}

interface SkyscannerAutoCompleteResponse {
  status: string;
  places: SkyscannerLocation[];
}

/**
 * Searches for locations using Skyscanner's auto-complete API
 * @param query Search term (city, airport, etc.)
 * @returns Array of location objects
 */
export async function searchSkyscannerLocations(query: string): Promise<Location[]> {
  // Don't search for very short queries
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Build the query URL
    const url = new URL('https://skyscanner89.p.rapidapi.com/flights/auto-complete');

    // Add required query parameters
    url.searchParams.append('query', query);
    url.searchParams.append('locale', 'en-US');
    url.searchParams.append('market', 'US');

    console.log(`Searching Skyscanner locations for: ${query}`);

    // Make the API request
    if (!SKYSCANNER_API_KEY) {
      throw new Error('Skyscanner API key is not defined');
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Host': SKYSCANNER_API_HOST,
        'X-RapidAPI-Key': SKYSCANNER_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Skyscanner API request failed: ${response.status} ${response.statusText}`);
    }

    const data: SkyscannerAutoCompleteResponse = await response.json();

    // Transform Skyscanner location data to our app's format
    return transformSkyscannerLocations(data);
  } catch (error) {
    return handleApiError(error, 'Skyscanner Auto-Complete', async () => {
      // Return mock data as fallback
      return getMockLocations(query);
    });
  }
}

/**
 * Transforms Skyscanner location data to our app's format
 */
function transformSkyscannerLocations(data: SkyscannerAutoCompleteResponse): Location[] {
  if (!data.places || !Array.isArray(data.places)) {
    return [];
  }

  return data.places.map(place => {
    // Determine location type
    let locationType: 'airport' | 'train_station' | 'bus_station' | 'city' = 'city';

    if (place.type === 'AIRPORT' || place.type === 'AIRPORT_GROUP') {
      locationType = 'airport';
    } else if (place.type === 'STATION') {
      // In Skyscanner, train stations are typically just 'STATION'
      // We could infer more accurately with additional data
      locationType = 'train_station';
    }

    // Create coordinates if available
    const coordinates = place.centroidCoordinates ? {
      lat: place.centroidCoordinates.latitude,
      lng: place.centroidCoordinates.longitude
    } : undefined;

    // Generate a unique ID
    const id = place.relevantFlightParams?.skyId?.toLowerCase() ||
      (place.iata ? place.iata.toLowerCase() :
        place.entityId.toLowerCase());

    // Create location name
    let name = place.name;
    if (place.cityName && place.cityName !== place.name) {
      name = `${place.name}, ${place.cityName}`;
    }
    if (place.countryName) {
      name = `${name}, ${place.countryName}`;
    }

    // Store Skyscanner-specific IDs for direct use in API calls
    const skyId = place.relevantFlightParams?.skyId || place.iata;
    const entityId = place.relevantFlightParams?.entityId || place.entityId;

    return {
      id,
      name,
      type: locationType,
      coordinates,
      // Add Skyscanner-specific information
      skyId,
      entityId
    };
  });
}

/**
 * Provides mock location data for fallback purposes
 */
function getMockLocations(query: string): Location[] {
  const mockLocations: Location[] = [
    {
      id: 'nyc',
      name: 'New York, NY, United States',
      type: 'city',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      id: 'jfk',
      name: 'John F. Kennedy International Airport, New York, United States',
      type: 'airport',
      coordinates: { lat: 40.6413, lng: -73.7781 }
    },
    {
      id: 'lga',
      name: 'LaGuardia Airport, New York, United States',
      type: 'airport',
      coordinates: { lat: 40.7769, lng: -73.8740 }
    },
    {
      id: 'bos',
      name: 'Boston, MA, United States',
      type: 'city',
      coordinates: { lat: 42.3601, lng: -71.0589 }
    },
    {
      id: 'sfo',
      name: 'San Francisco, CA, United States',
      type: 'city',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    {
      id: 'lax',
      name: 'Los Angeles International Airport, United States',
      type: 'airport',
      coordinates: { lat: 33.9416, lng: -118.4085 }
    }
  ];

  const lowerQuery = query.toLowerCase();
  return mockLocations.filter(location =>
    location.name.toLowerCase().includes(lowerQuery)
  );
}