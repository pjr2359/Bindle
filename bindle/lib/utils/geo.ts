// lib/utils/geo.ts
import { Location } from '@/types/location';
import { searchSkyscannerLocations } from '@/lib/api/services/skyscanner-locations';
import { cachedApiRequest } from '@/lib/api/cache';

// For fallback, we'll keep our mock location database
// This will be used when API calls fail
const popularLocations: Location[] = [
  {
    id: 'nyc',
    name: 'New York, NY',
    type: 'city',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    skyId: 'NYC',
    entityId: '27537542'
  },
  {
    id: 'jfk',
    name: 'JFK Airport, NY',
    type: 'airport',
    coordinates: { lat: 40.6413, lng: -73.7781 },
    skyId: 'JFK',
    entityId: '95673298'
  },
  {
    id: 'lga',
    name: 'LaGuardia Airport, NY',
    type: 'airport',
    coordinates: { lat: 40.7769, lng: -73.8740 },
    skyId: 'LGA',
    entityId: '95565060'
  },
  {
    id: 'bos',
    name: 'Boston, MA',
    type: 'city',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    skyId: 'BOS',
    entityId: '27538629'
  },
  {
    id: 'sfo',
    name: 'San Francisco, CA',
    type: 'city',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    skyId: 'SFO',
    entityId: '27544026'
  },
  {
    id: 'lax',
    name: 'Los Angeles International Airport',
    type: 'airport',
    coordinates: { lat: 33.9416, lng: -118.4085 },
    skyId: 'LAX',
    entityId: '95673784'
  },
  {
    id: 'chi',
    name: 'Chicago, IL',
    type: 'city',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    skyId: 'CHI',
    entityId: '27535663'
  },
  {
    id: 'ord',
    name: "O'Hare International Airport, Chicago",
    type: 'airport',
    coordinates: { lat: 41.9742, lng: -87.9073 },
    skyId: 'ORD',
    entityId: '95673749'
  },
  {
    id: 'ith',
    name: 'Ithaca, NY',
    type: 'city',
    coordinates: { lat: 42.4440, lng: -76.5019 },
    skyId: 'ITH',
    entityId: '27545475'
  },
  {
    id: 'ath',
    name: 'Athens, Greece',
    type: 'city',
    coordinates: { lat: 37.9838, lng: 23.7275 },
    skyId: 'ATH',
    entityId: '27539604'
  },
  {
    id: 'ath-airport',
    name: 'Athens International Airport',
    type: 'airport',
    coordinates: { lat: 37.9364, lng: 23.9445 },
    skyId: 'ATH',
    entityId: '95673376'
  }
];

// Function to search for locations by name
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.length < 2) return [];

  // Use the cache with a 24-hour TTL for location searches
  return cachedApiRequest(
    { type: 'location_search', query },
    async () => {
      try {
        // First try to get locations from Skyscanner API
        const apiResults = await searchSkyscannerLocations(query);

        // If we got results, return them
        if (apiResults && apiResults.length > 0) {
          return apiResults;
        }

        // If API call failed or returned no results, fall back to our mock data
        const lowerQuery = query.toLowerCase();
        return popularLocations.filter(location =>
          location.name.toLowerCase().includes(lowerQuery)
        );
      } catch (error) {
        console.error('Error searching locations:', error);

        // Fallback to mock data if API call fails
        const lowerQuery = query.toLowerCase();
        return popularLocations.filter(location =>
          location.name.toLowerCase().includes(lowerQuery)
        );
      }
    },
    // Cache location searches for 24 hours (86400 seconds)
    86400
  );
}

// Function to find nearby transportation hubs
export async function findNearbyTransportLocations(locationName: string): Promise<Location[]> {
  // Find the base location
  const locations = await searchLocations(locationName);
  if (locations.length === 0) return [];

  const mainLocation = locations[0];

  // For a real implementation, we could make an API call to get nearby transportation hubs
  // For now, we'll use a simple approach based on our mock data

  // Cache nearby transport searches with a 48-hour TTL
  return cachedApiRequest(
    { type: 'nearby_transport', location: mainLocation.id },
    async () => {
      try {
        // If location is a city, return airports and stations that match the city name
        if (mainLocation.type === 'city') {
          // Get the city name without state/country
          const cityName = mainLocation.name.split(',')[0].toLowerCase();

          // Find all transportation hubs that match this city
          return popularLocations.filter(loc =>
            loc.type !== 'city' &&
            loc.name.toLowerCase().includes(cityName)
          );
        }

        // If it's already a transportation hub, just return it
        return [mainLocation];
      } catch (error) {
        console.error('Error finding nearby transport locations:', error);
        return [mainLocation];
      }
    },
    // Cache nearby transport searches for 48 hours (172800 seconds)
    172800
  );
}

// Get a location by ID
export function getLocationById(id: string): Location | undefined {
  return popularLocations.find(loc => loc.id === id);
}

// Calculate distance between two locations
export function getDistanceBetweenLocations(loc1: Location, loc2: Location): number {
  if (!loc1.coordinates || !loc2.coordinates) {
    return -1; // Unable to calculate
  }

  // Use the Haversine formula
  const R = 6371; // Radius of the Earth in km
  const dLat = (loc2.coordinates.lat - loc1.coordinates.lat) * Math.PI / 180;
  const dLon = (loc2.coordinates.lng - loc1.coordinates.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.coordinates.lat * Math.PI / 180) * Math.cos(loc2.coordinates.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}