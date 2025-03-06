import { searchFlights } from '@/lib/api/flights';
import { Location } from '@/types/location';
import * as cache from '@/lib/api/cache';

// Mock the cache module
jest.mock('@/lib/api/cache', () => ({
  cachedApiRequest: jest.fn((params, fetchFn) => fetchFn()),
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      content: {
        results: {
          itineraries: {
            item1: {
              legs: [
                {
                  departure: '2025-06-01T08:00:00',
                  arrival: '2025-06-01T10:30:00',
                  carriers: [{ name: 'Test Airlines' }]
                }
              ],
              pricingOptions: [
                {
                  price: { amount: 199.99 },
                  items: [{ deepLink: 'https://example.com' }]
                }
              ]
            }
          }
        }
      }
    }),
  })
) as jest.Mock;

describe('Flight API', () => {
  const origin: Location = {
    id: 'nyc',
    name: 'New York',
    type: 'city',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    skyId: 'NYC',
    entityId: '27537542'
  };

  const destination: Location = {
    id: 'lax',
    name: 'Los Angeles',
    type: 'city',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    skyId: 'LAX',
    entityId: '27544850'
  };

  const date = '2025-06-01';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return flight segments when API call succeeds', async () => {
    const segments = await searchFlights(origin, destination, date);

    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('flight');
    expect(segments[0].price).toBe(199.99);
    expect(segments[0].provider).toBe('Test Airlines');
  });

  it('should fall back to mock data when API call fails', async () => {
    // Make fetch fail
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('API unavailable'))
    );

    const segments = await searchFlights(origin, destination, date);

    // Should return mock data
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].type).toBe('flight');
  });

  it('should skip API call for very short distances', async () => {
    const closeOrigin: Location = {
      id: 'jfk',
      name: 'JFK Airport',
      type: 'airport',
      coordinates: { lat: 40.6413, lng: -73.7781 },
    };

    const closeDestination: Location = {
      id: 'lga',
      name: 'LaGuardia Airport',
      type: 'airport',
      coordinates: { lat: 40.7769, lng: -73.8740 },
    };

    const segments = await searchFlights(closeOrigin, closeDestination, date);

    expect(segments).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});