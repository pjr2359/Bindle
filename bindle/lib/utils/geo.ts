// lib/utils/geo.ts
import { Location } from '@/types/location';
import { searchSkyscannerLocations } from '@/lib/api/services/skyscanner-locations';
import { cachedApiRequest } from '@/lib/api/cache';
import { withRateLimit } from '@/lib/api/rateLimiter';

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
  // Additional locations remain the same...
];

// In-memory location cache to avoid repeated API calls for the same location
const locationCache = new Map<string, Location>();

// Initialize the cache with popular locations
popularLocations.forEach(location => {
  locationCache.set(location.id, location);
  // Also index by name for fuzzy lookups
  locationCache.set(location.name.toLowerCase(), location);
});

/**
 * Function to search for locations by name with caching and rate limiting
 */
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.length < 2) return [];

  // Normalize the query
  const normalizedQuery = query.toLowerCase().trim();

  // Use cached API request with 24-hour TTL for location searches
  try {
    const results = await cachedApiRequest(
      { query: `location-search-${normalizedQuery}` },
      () => searchSkyscannerLocations(normalizedQuery),
      24 * 60 * 60 * 1000 // 24 hours
    );
    return results;
  } catch (error) {
    console.error('Error searching locations:', error);
    return []; // Return empty array instead of falling back to mock data
  }
}

/**
 * Get locations from our fallback database
 */
function getFallbackLocations(query: string): Location[] {
  // First check if we have an exact match in our cache
  const exactMatch = locationCache.get(query);
  if (exactMatch) {
    return [exactMatch];
  }

  // Otherwise do a fuzzy search on popular locations
  return popularLocations.filter(location =>
    location.name.toLowerCase().includes(query)
  );
}

/**
 * Find nearby transportation hubs with optimized caching
 */
export async function findNearbyTransportLocations(locationName: string): Promise<Location[]> {
  // Normalize location name
  const normalizedName = locationName.toLowerCase().trim();

  // Cache these results for 48 hours
  return cachedApiRequest(
    { type: 'nearby_transport', location: normalizedName },
    async () => {
      try {
        // Find the main location first
        const locations = await searchLocations(normalizedName);
        if (locations.length === 0) return [];

        const mainLocation = locations[0];

        // If it's a city, find transportation hubs
        if (mainLocation.type === 'city') {
          // Get the city name without state/country
          const cityName = mainLocation.name.split(',')[0].toLowerCase();

          // Find all transportation hubs that match this city
          const transportHubs = popularLocations.filter(loc =>
            loc.type !== 'city' &&
            loc.name.toLowerCase().includes(cityName)
          );

          // Limit the number of transport locations to avoid too many combinations
          return transportHubs.slice(0, 3);
        }

        // If it's already a transportation hub, just return it
        return [mainLocation];
      } catch (error) {
        console.error('Error finding nearby transport locations:', error);
        return [];
      }
    },
    // Cache for 48 hours (172800 seconds)
    172800,
    'location'
  );
}

/**
 * Get a location by ID - API only, no mock fallback
 */
export async function getLocationById(id: string): Promise<Location | null> {
  if (!id) return null;

  // Check cache first
  const normalizedId = id.toLowerCase();

  // Check cache with normalized ID
  for (const [cacheKey, location] of locationCache.entries()) {
    if (cacheKey.toLowerCase() === normalizedId ||
      location.id.toLowerCase() === normalizedId ||
      (location.skyId && location.skyId.toLowerCase() === normalizedId)) {
      return location;
    }
  }

  // If not in cache, search via API
  try {
    const results = await searchLocations(id);
    const location = results.find(loc => loc.id === id);

    if (location) {
      // Cache the result
      locationCache.set(id, location);
      return location;
    }

    return null; // No fallback, return null if not found
  } catch (error) {
    console.error(`Error fetching location with ID ${id}:`, error);
    return null;
  }
}

/**
 * Calculate distance between two locations
 */
export function getDistanceBetweenLocations(loc1: Location, loc2: Location): number {
  if (!loc1.coordinates || !loc2.coordinates) {
    return -1; // Unable to calculate
  }

  // Use the haversine formula
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