// lib/api/flights.ts – Amadeus only; no mock fallback
import { Location } from '@/types/location';
import { TransportSegment } from '@/types/segment';
import { formatApiDate, calculateDistance } from './utils';
import { cachedApiRequest } from './cache';
import { withRateLimit } from './rateLimiter';
import { searchFlightOffers, type AmadeusFlightOffer } from './services/amadeusClient';

const locationIataCache = new Map<string, string>();

/** Amadeus IATA code – must come from location API (location.skyId). */
function getIataCode(location: Location): string | null {
  if (locationIataCache.has(location.id)) {
    return locationIataCache.get(location.id)!;
  }
  if (location.skyId) {
    locationIataCache.set(location.id, location.skyId);
    return location.skyId;
  }
  return null;
}

/**
 * Amadeus Flight Offers Search → TransportSegment[].
 * Flight search runs only when both locations have an IATA code (skyId from the location API).
 * If either is missing skyId, we return [] and do not call Amadeus.
 */
async function searchFlightsAmadeus(
  origin: Location,
  destination: Location,
  dateStr: string
): Promise<TransportSegment[]> {
  const originIata = getIataCode(origin);
  const destinationIata = getIataCode(destination);
  if (!originIata || !destinationIata) return [];
  const res = await searchFlightOffers({
    originLocationCode: originIata,
    destinationLocationCode: destinationIata,
    departureDate: dateStr,
  });
  if (!res.data?.length) return [];
  return transformAmadeusResults(res.data, origin, destination);
}

function transformAmadeusResults(
  offers: AmadeusFlightOffer[],
  origin: Location,
  destination: Location
): TransportSegment[] {
  const segments: TransportSegment[] = [];
  offers.slice(0, 20).forEach((offer, index) => {
    const itinerary = offer.itineraries?.[0];
    const segs = itinerary?.segments ?? [];
    if (segs.length === 0) return;
    const first = segs[0];
    const last = segs[segs.length - 1];
    const departureTime = first.departure?.at ?? new Date().toISOString();
    const arrivalTime = last.arrival?.at ?? new Date().toISOString();
    const dep = new Date(departureTime);
    const arr = new Date(arrivalTime);
    const arrivalDayOffset = getDayOffset(dep, arr);
    const priceStr = offer.price?.grandTotal ?? offer.price?.total ?? '0';
    const carrierCode = first.carrierCode ?? '—';
    const isDirect = segs.length === 1;
    segments.push({
      id: `flight-amadeus-${Date.now()}-${index}-${offer.id ?? index}`,
      origin,
      destination,
      departureTime,
      arrivalTime,
      arrivalDayOffset,
      price: parseFloat(priceStr),
      type: 'flight',
      provider: carrierCode,
      bookingLink: 'https://www.amadeus.com',
      isDirect,
    });
  });
  return segments;
}

function getDayOffset(dep: Date, arr: Date): number | undefined {
  const depDay = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate()).getTime();
  const arrDay = new Date(arr.getFullYear(), arr.getMonth(), arr.getDate()).getTime();
  const dayDiff = Math.round((arrDay - depDay) / (24 * 60 * 60 * 1000));
  return dayDiff !== 0 ? dayDiff : undefined;
}

export async function searchFlights(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  return cachedApiRequest(
    { type: 'flight_search', origin: origin.id, destination: destination.id, date: formatApiDate(date) },
    () => performFlightSearch(origin, destination, date),
    6 * 60 * 60
  );
}

async function performFlightSearch(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  if (origin.coordinates && destination.coordinates) {
    const distance = calculateDistance(
      origin.coordinates.lat,
      origin.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );
    if (distance < 100) return [];
  }

  const hasAmadeus = !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  if (!hasAmadeus) return [];

  try {
    const formattedDate = formatApiDate(date);
    return await withRateLimit('amadeus', () =>
      searchFlightsAmadeus(origin, destination, formattedDate)
    );
  } catch (error) {
    console.error('Amadeus flight search error:', error);
    return [];
  }
}
