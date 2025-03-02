// lib/services/hereService.ts
export async function getHereRoute(origin: string, destination: string, mode: string = 'driving') {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) throw new Error('HERE_API_KEY is not defined.');

  const transportMode = mode === 'driving' ? 'car' : 'pedestrian';

  const url = new URL('https://router.hereapi.com/v8/routes');
  url.searchParams.append('transportMode', transportMode);
  url.searchParams.append('origin', origin);
  url.searchParams.append('destination', destination);
  url.searchParams.append('return', 'summary,polyline,actions,instructions');
  url.searchParams.append('apikey', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`HERE error: ${response.statusText}`);

  return response.json();
}