/**
 * Amadeus for Developers Self-Service API client.
 * - Auth: OAuth2 client_credentials → access token (cached).
 * - Flight Offers Search: POST /v2/shopping/flight-offers (test: 2,000 free/month, 10 TPS, 1 req/100ms).
 * @see https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/API-Keys/authorization/
 * @see https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
 */

const AMADEUS_TEST_HOST = 'https://test.api.amadeus.com';
const TOKEN_URL = `${AMADEUS_TEST_HOST}/v1/security/oauth2/token`;
const FLIGHT_OFFERS_URL = `${AMADEUS_TEST_HOST}/v2/shopping/flight-offers`;
const LOCATIONS_URL = `${AMADEUS_TEST_HOST}/v1/reference-data/locations`;

let cachedToken: { access_token: string; expires_at: number } | null = null;
const TOKEN_BUFFER_MS = 60 * 1000; // refresh 1 min before expiry

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + TOKEN_BUFFER_MS) {
    return cachedToken.access_token;
  }
  const clientId = process.env.AMADEUS_CLIENT_ID || '';
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) {
    throw new Error('AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET are required');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus token failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const expiresIn = (data.expires_in ?? 30) * 1000; // default 30 min
  cachedToken = {
    access_token: data.access_token,
    expires_at: now + expiresIn,
  };
  return data.access_token;
}

/** Request body for POST /v2/shopping/flight-offers (one-way, single OD) */
export interface AmadeusFlightSearchParams {
  originLocationCode: string;   // IATA code from location API
  destinationLocationCode: string;
  departureDate: string;        // YYYY-MM-DD
}

/** One flight offer from Amadeus (minimal shape we use) */
export interface AmadeusFlightOffer {
  type?: string;
  id?: string;
  source?: string;
  instantTicketingRequired?: boolean;
  nonHomogeneous?: boolean;
  oneWay?: boolean;
  lastTicketingDate?: string;
  numberOfBookableSeats?: number;
  itineraries?: Array<{
    duration?: string;
    segments?: Array<{
      departure?: { iataCode?: string; terminal?: string; at?: string };
      arrival?: { iataCode?: string; terminal?: string; at?: string };
      carrierCode?: string;
      number?: string;
      aircraft?: { code?: string };
      operating?: { carrierCode?: string };
      duration?: string;
      id?: string;
    }>;
  }>;
  price?: { currency?: string; total?: string; base?: string; grandTotal?: string };
}

export interface AmadeusFlightOffersResponse {
  meta?: { count?: number };
  data?: AmadeusFlightOffer[];
}

/**
 * Search flight offers (one-way). Uses GDS source.
 * Rate: test 10 TPS, 1 request per 100ms → we rely on rate limiter (e.g. 8/sec or 480/min).
 */
export async function searchFlightOffers(params: AmadeusFlightSearchParams): Promise<AmadeusFlightOffersResponse> {
  const token = await getAccessToken();
  const body = {
    originDestinations: [
      {
        id: '1',
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDateTimeRange: { date: params.departureDate },
      },
    ],
    travelers: [{ id: '1', travelerType: 'ADULT' }],
    sources: ['GDS'],
  };
  const res = await fetch(FLIGHT_OFFERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus flight-offers failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<AmadeusFlightOffersResponse>;
}

/** Amadeus location entry (reference-data/locations response) */
interface AmadeusLocationItem {
  iataCode?: string;
  name?: string;
  detailedName?: string;
  address?: { cityName?: string; countryCode?: string };
  geoCode?: { latitude?: number; longitude?: number };
  subType?: string;
}

/**
 * Get airports (and optionally cities) by keyword via Amadeus reference-data/locations.
 * Used to group airports by city with no hardcoded lists.
 * Requires AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET.
 */
export async function searchAmadeusLocations(
  keyword: string,
  subType: 'AIRPORT' | 'CITY' | 'AIRPORT,CITY' = 'AIRPORT'
): Promise<AmadeusLocationItem[]> {
  const token = await getAccessToken();
  const params = new URLSearchParams({
    keyword: keyword.trim(),
    subType,
    'page[limit]': '20',
  });
  const res = await fetch(`${LOCATIONS_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amadeus locations failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { data?: AmadeusLocationItem[] };
  return json.data ?? [];
}
