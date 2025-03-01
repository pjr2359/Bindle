import { Location } from '@/types/location';

/**
 * Formats a date string to the YYYY-MM-DD format required by most APIs
 */
export function formatApiDate(date: string): string {
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Handle API errors consistently
 */
export function handleApiError<T>(error: any, service: string, fallbackFn?: () => Promise<T>): Promise<T> {
  console.error(`Error in ${service} API:`, error);

  if (fallbackFn) {
    console.log(`Using fallback for ${service}`);
    return fallbackFn();
  }

  return Promise.resolve([] as unknown as T);
}