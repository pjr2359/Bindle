/**
 * Build booking/search URLs for flights from segment data (no API required).
 * Uses origin/destination IATA and departure date.
 */

function getIata(place: { skyId?: string; name?: string } | string): string | null {
  if (typeof place === 'string') return null;
  const code = place?.skyId?.trim();
  return code && code.length >= 2 ? code.toUpperCase() : null;
}

function formatDateYmd(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYYMMDD for Skyscanner */
function formatDateYyyymmdd(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export interface BookingOption {
  label: string;
  url: string;
  description?: string;
}

/**
 * Returns search links for this route (same date, origin, destination).
 * These open a search to compare and book—we cannot link to a specific offer without an API.
 */
export function getFlightBookingLinks(
  origin: { skyId?: string; name?: string } | string,
  destination: { skyId?: string; name?: string } | string,
  departureTime: string
): BookingOption[] {
  const from = getIata(origin);
  const to = getIata(destination);
  if (!from || !to || !departureTime) return [];

  const dateYmd = formatDateYmd(departureTime);
  const dateYyyymmdd = formatDateYyyymmdd(departureTime);
  const links: BookingOption[] = [];

  // Google Travel Flights (current product URL)
  links.push({
    label: 'Search on Google Flights',
    url: `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(from)}%20to%20${encodeURIComponent(to)}%20on%20${dateYmd}`,
    description: 'Compare prices',
  });

  // Skyscanner: uppercase IATA, YYYYMMDD (e.g. /transport/flights/JFK/LHR/20250601/)
  links.push({
    label: 'Search on Skyscanner',
    url: `https://www.skyscanner.com/transport/flights/${from}/${to}/${dateYyyymmdd}/`,
    description: 'Compare deals',
  });

  // Kayak: search only (no direct book link without offer ID)
  links.push({
    label: 'Search on Kayak',
    url: `https://www.kayak.com/flights/${from}-${to}/${dateYmd}`,
    description: 'Compare & book',
  });

  return links;
}
