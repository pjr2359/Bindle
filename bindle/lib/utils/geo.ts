// lib/utils/geo.ts – locations and autocomplete via Amadeus only (no hardcoded data)
import { Location } from '@/types/location';
import { searchAmadeusLocations } from '@/lib/api/services/amadeusClient';
import { cachedApiRequest } from '@/lib/api/cache';
import { withRateLimit } from '@/lib/api/rateLimiter';

const locationCache = new Map<string, Location>();

/** Map Amadeus location item to our Location type (id must be unique per result). */
function amadeusToLocation(item: { iataCode?: string; name?: string; detailedName?: string; address?: { cityName?: string; countryCode?: string }; geoCode?: { latitude?: number; longitude?: number }; subType?: string }, index: number): Location {
  const iata = item.iataCode ?? '';
  const id = iata ? iata.toLowerCase() : `loc-${index}`;
  const name = item.detailedName ?? item.name ?? iata;
  const type = item.subType === 'CITY' ? 'city' : 'airport';
  const coordinates =
    item.geoCode?.latitude != null && item.geoCode?.longitude != null
      ? { lat: item.geoCode.latitude, lng: item.geoCode.longitude }
      : undefined;
  return { id, name, type, coordinates, skyId: iata || undefined };
}

/**
 * Search locations (autocomplete) by name. Uses Amadeus reference-data/locations only.
 * Returns cities and airports matching the keyword. Requires AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.
 */
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.trim();

  try {
    const results = await cachedApiRequest(
      { query: `location-search-${normalizedQuery.toLowerCase()}` },
      async () => {
        const data = await withRateLimit('amadeus', () =>
          searchAmadeusLocations(normalizedQuery, 'AIRPORT,CITY')
        );
        return data.map((item, i) => amadeusToLocation(item, i));
      },
      24 * 60 * 60 * 1000
    );
    if (results.length > 0) {
      results.forEach((loc) => {
        locationCache.set(loc.id, loc);
        locationCache.set(loc.name.toLowerCase(), loc);
      });
      return results;
    }
  } catch (error) {
    console.error('Error searching locations (Amadeus):', error);
  }
  return [];
}

/**
 * Find nearby transport hubs (e.g. airports) for a location.
 * For cities: uses Amadeus reference-data/locations to get airports by city name (no hardcoded lists).
 * For airports/stations: returns just that location.
 */
export async function findNearbyTransportLocations(locationName: string): Promise<Location[]> {
  const normalizedName = locationName.toLowerCase().trim();

  return cachedApiRequest(
    { type: 'nearby_transport', location: normalizedName },
    async () => {
      try {
        const locations = await searchLocations(normalizedName);
        if (locations.length === 0) return [];

        const mainLocation = locations[0];

        if (mainLocation.type === 'city') {
          const cityName = mainLocation.name.split(',')[0].trim();
          if (!cityName) return [];
          try {
            const amadeusLocations = await withRateLimit('amadeus', () =>
              searchAmadeusLocations(cityName, 'AIRPORT')
            );
            return amadeusLocations
              .filter((loc) => loc.iataCode)
              .map((loc) => ({
                id: loc.iataCode!.toLowerCase(),
                name: loc.detailedName ?? loc.name ?? loc.iataCode!,
                type: 'airport' as const,
                coordinates:
                  loc.geoCode?.latitude != null && loc.geoCode?.longitude != null
                    ? { lat: loc.geoCode.latitude, lng: loc.geoCode.longitude }
                    : undefined,
                skyId: loc.iataCode,
              }));
          } catch (err) {
            console.warn('Amadeus locations (airports by city) failed, using only main location:', err);
            return [];
          }
        }

        return [mainLocation];
      } catch (error) {
        console.error('Error finding nearby transport locations:', error);
        return [];
      }
    },
    172800,
    'location'
  );
}

/**
 * Get location by ID. Resolves from cache or via location search API only.
 */
export async function getLocationById(id: string): Promise<Location | null> {
  if (!id) return null;

  const normalizedId = id.toLowerCase();

  for (const [cacheKey, location] of locationCache.entries()) {
    if (
      cacheKey.toLowerCase() === normalizedId ||
      location.id.toLowerCase() === normalizedId ||
      (location.skyId && location.skyId.toLowerCase() === normalizedId)
    ) {
      return location;
    }
  }

  try {
    const results = await searchLocations(id);
    const location = results.find((loc) => loc.id === id || loc.skyId === id);
    if (location) {
      locationCache.set(location.id, location);
      locationCache.set(location.name.toLowerCase(), location);
      return location;
    }
  } catch (error) {
    console.error(`Error getLocationById(${id}):`, error);
  }
  return null;
}

/**
 * Calculate distance between two locations (haversine), in km.
 */
export function getDistanceBetweenLocations(loc1: Location, loc2: Location): number {
  if (!loc1.coordinates || !loc2.coordinates) return -1;

  const R = 6371;
  const dLat = ((loc2.coordinates.lat - loc1.coordinates.lat) * Math.PI) / 180;
  const dLon = ((loc2.coordinates.lng - loc1.coordinates.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.coordinates.lat * Math.PI) / 180) *
      Math.cos((loc2.coordinates.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
