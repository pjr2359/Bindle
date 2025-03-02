// __tests__/services/hereService.test.ts
import { getHereRoute } from '../../lib/api/services/hereService';

// Set environment variable before tests run
beforeAll(() => {
  process.env.HERE_API_KEY = 'test-api-key'; // Mock API key for tests
});

// Mock `global.fetch`
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      routes: [{ id: 'mock-route', summary: { duration: 600, length: 10000 } }]
    }),
  })
) as jest.Mock;

describe('getHereRoute', () => {
  it('should return route data successfully', async () => {
    const result = await getHereRoute('37.7749,-122.4194', '34.0522,-118.2437', 'driving');

    expect(result).toHaveProperty('routes');
    expect(result.routes[0]).toHaveProperty('id', 'mock-route');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when API response is not ok', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, statusText: 'Bad Request' })
    );

    await expect(getHereRoute('37.7749,-122.4194', '34.0522,-118.2437', 'driving'))
      .rejects.toThrow('HERE error: Bad Request');
  });

  it('should throw an error if HERE_API_KEY is missing', async () => {
    delete process.env.HERE_API_KEY; // Simulate missing API key

    await expect(getHereRoute('37.7749,-122.4194', '34.0522,-118.2437', 'driving'))
      .rejects.toThrow('HERE_API_KEY is not defined.');
  });
});