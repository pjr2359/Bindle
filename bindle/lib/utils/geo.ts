import { Location } from '@/types/location';

// For MVP, we'll use a mock location database
// Later you can integrate with a geocoding API like Google Places or Mapbox
const popularLocations: Location[] = [
  {
    id: 'nyc',
    name: 'New York, NY',
    type: 'city',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: 'jfk',
    name: 'JFK Airport, NY',
    type: 'airport',
    coordinates: { lat: 40.6413, lng: -73.7781 }
  },
  {
    id: 'lga',
    name: 'LaGuardia Airport, NY',
    type: 'airport',
    coordinates: { lat: 40.7769, lng: -73.8740 }
  },
  {
    id: 'bos',
    name: 'Boston, MA',
    type: 'city',
    coordinates: { lat: 42.3601, lng: -71.0589 }
  },
  {
    id: 'sfo',
    name: 'San Francisco, CA',
    type: 'city',
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    id: 'lax',
    name: 'Los Angeles International Airport',
    type: 'airport',
    coordinates: { lat: 33.9416, lng: -118.4085 }
  },
  {
    id: 'chi',
    name: 'Chicago, IL',
    type: 'city',
    coordinates: { lat: 41.8781, lng: -87.6298 }
  },
  {
    id: 'ord',
    name: "O'Hare International Airport, Chicago",
    type: 'airport',
    coordinates: { lat: 41.9742, lng: -87.9073 }
  },
  {
    id: 'ith',
    name: 'Ithaca, NY',
    type: 'city',
    coordinates: { lat: 42.4440, lng: -76.5019 }
  },
  {
    id: 'ath',
    name: 'Athens, Greece',
    type: 'city',
    coordinates: { lat: 37.9838, lng: 23.7275 }
  },
  {
    id: 'ath-airport',
    name: 'Athens International Airport',
    type: 'airport',
    coordinates: { lat: 37.9364, lng: 23.9445 }
  }
];

// Function to search for locations by name
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.length < 2) return [];

  // In a real app, you'd call a geocoding API here
  // For MVP, filter our mock data
  const lowerQuery = query.toLowerCase();
  return popularLocations.filter(location =>
    location.name.toLowerCase().includes(lowerQuery)
  );
}

// Function to find nearby transportation hubs
export async function findNearbyTransportLocations(locationName: string): Promise<Location[]> {
  // Find the base location
  const locations = await searchLocations(locationName);
  if (locations.length === 0) return [];

  const mainLocation = locations[0];

  // In a real app, you'd call an API to find nearby transport hubs
  // For MVP, just return all locations of the same city or related to the search
  if (mainLocation.type === 'city') {
    // Return airports and stations that contain the city name
    return popularLocations.filter(loc =>
      loc.type !== 'city' &&
      loc.name.toLowerCase().includes(mainLocation.name.split(',')[0].toLowerCase())
    );
  }

  return [mainLocation];
}

// Get a location by ID
export function getLocationById(id: string): Location | undefined {
  return popularLocations.find(loc => loc.id === id);
}