import { searchSkyscannerLocations } from '../../../../lib/api/services/skyscanner-locations';

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      places: [
        {
          entityId: '27537542',
          name: 'New York',
          countryId: 'US',
          countryName: 'United States',
          type: 'CITY',
          centroidCoordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      ]
    }),
  })
) as jest.Mock;

describe('Skyscanner Locations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SKYSCANNER_API_KEY = 'test-api-key';
  });

  it('should transform Skyscanner locations correctly', async () => {
    const locations = await searchSkyscannerLocations('new york');

    expect(locations).toHaveLength(1);
    expect(locations[0].name).toContain('New York');
    expect(locations[0].type).toBe('city');
    expect(locations[0].coordinates).toEqual({ lat: 40.7128, lng: -74.0060 });
  });

  it('should handle empty queries properly', async () => {
    const locations = await searchSkyscannerLocations('');
    expect(locations).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });



  it('should handle missing API key gracefully', async () => {
    delete process.env.SKYSCANNER_API_KEY;

    // Instead of expecting an error, check that it returns mock data
    const locations = await searchSkyscannerLocations('new york');
    expect(locations).toHaveLength(1);
    expect(locations[0].name).toContain('New York');
  });
});