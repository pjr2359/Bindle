import { searchFlights } from '@/lib/api/flights';
import { Location } from '@/types/location';
import * as cache from '@/lib/api/cache';
import * as amadeusClient from '@/lib/api/services/amadeusClient';

jest.mock('@/lib/api/cache', () => ({
  cachedApiRequest: jest.fn((params, fetchFn) => fetchFn()),
}));

jest.mock('@/lib/api/services/amadeusClient', () => ({
  ...jest.requireActual('@/lib/api/services/amadeusClient'),
  searchFlightOffers: jest.fn(),
}));

const mockSearchFlightOffers = amadeusClient.searchFlightOffers as jest.Mock;

// Amadeus Flight Offers response shape
const mockAmadeusResponse = () => ({
  data: [
    {
      id: 'offer-1',
      itineraries: [
        {
          segments: [
            {
              departure: { at: '2025-06-01T08:00:00' },
              arrival: { at: '2025-06-01T10:30:00' },
              carrierCode: 'TA',
            },
          ],
        },
      ],
      price: { grandTotal: '199.99' },
    },
  ],
});

describe('Flight API', () => {
  const origin: Location = {
    id: 'nyc',
    name: 'New York',
    type: 'city',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    skyId: 'NYC',
  };

  const destination: Location = {
    id: 'lax',
    name: 'Los Angeles',
    type: 'city',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    skyId: 'LAX',
  };

  const date = '2025-06-01';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AMADEUS_CLIENT_ID = 'test-id';
    process.env.AMADEUS_CLIENT_SECRET = 'test-secret';
    mockSearchFlightOffers.mockResolvedValue(mockAmadeusResponse());
  });

  it('should return flight segments when Amadeus returns offers', async () => {
    const segments = await searchFlights(origin, destination, date);

    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].type).toBe('flight');
    expect(segments[0].price).toBe(199.99);
    expect(segments[0].provider).toBe('TA');
    expect(mockSearchFlightOffers).toHaveBeenCalled();
  });

  it('should return no segments when Amadeus fails', async () => {
    mockSearchFlightOffers.mockRejectedValueOnce(new Error('API unavailable'));

    const segments = await searchFlights(origin, destination, date);

    expect(segments).toHaveLength(0);
  });

  it('should skip flight search for very short distances', async () => {
    const closeOrigin: Location = {
      id: 'jfk',
      name: 'JFK Airport',
      type: 'airport',
      coordinates: { lat: 40.6413, lng: -73.7781 },
      skyId: 'JFK',
    };

    const closeDestination: Location = {
      id: 'lga',
      name: 'LaGuardia Airport',
      type: 'airport',
      coordinates: { lat: 40.7769, lng: -73.8740 },
      skyId: 'LGA',
    };

    const segments = await searchFlights(closeOrigin, closeDestination, date);

    expect(segments).toHaveLength(0);
    expect(mockSearchFlightOffers).not.toHaveBeenCalled();
  });
});
