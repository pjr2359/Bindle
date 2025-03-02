// lib/ai/openai-flights.ts
import { Location } from '@/types/location';
import { TransportSegment } from '@/types/segment';
import { formatApiDate, calculateDistance } from '../api/utils';

// Configure with your OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Use ChatGPT to generate realistic flight information
 */
export async function searchFlightsWithAI(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  try {
    const formattedDate = formatApiDate(date);
    console.log(`Using ChatGPT to search flights from ${origin.name} to ${destination.name} on ${formattedDate}`);

    // Construct a detailed prompt for the AI
    const prompt = `
You are a flight data API. I need realistic flight options for a trip from ${origin.name} (${origin.id}) to ${destination.name} (${destination.id}) on ${formattedDate}.

Please provide 5-7 flight options with these properties:
- airline: The name of the airline
- flightNumber: A realistic flight number for that airline
- departureTime: Time of departure (HH:MM, 24-hour format)
- arrivalTime: Time of arrival (HH:MM, 24-hour format)
- price: Realistic price in USD (just the number)
- duration: Flight duration in hours (decimal format, e.g., 2.5)

Respond ONLY with a valid JSON array of flight objects. No explanations or other text.
`;

    // Make request to OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a flight data API that returns only JSON data. No explanations or markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }, // This ensures JSON response format
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the JSON response
    let flights;
    try {
      const parsedResponse = JSON.parse(aiResponse);
      flights = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.flights;

      if (!Array.isArray(flights)) {
        throw new Error('Expected array of flights');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse flight data from AI response');
    }

    // Transform AI-provided flights to TransportSegment format
    return flights.map((flight: any, index: number) => {
      // Parse departure and arrival times
      const departureTime = new Date(`${formattedDate}T${flight.departureTime || '12:00:00'}`);
      let arrivalTime;

      if (flight.arrivalTime) {
        arrivalTime = new Date(`${formattedDate}T${flight.arrivalTime}`);
        // If arrival time is before departure time, it's likely the next day
        if (arrivalTime < departureTime) {
          arrivalTime.setDate(arrivalTime.getDate() + 1);
        }
      } else if (flight.duration) {
        // Calculate arrival time based on duration (in hours)
        arrivalTime = new Date(departureTime);
        arrivalTime.setHours(arrivalTime.getHours() + parseFloat(flight.duration));
      } else {
        // Estimate duration based on distance
        const estimatedHours = estimateFlightDuration(origin, destination);
        arrivalTime = new Date(departureTime);
        arrivalTime.setHours(arrivalTime.getHours() + estimatedHours);
      }

      return {
        id: `ai-flight-${Date.now()}-${index}`,
        origin,
        destination,
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        price: typeof flight.price === 'number' ? flight.price :
          typeof flight.price === 'string' ? parseFloat(flight.price.replace(/[^0-9.]/g, '')) :
            199 + Math.floor(Math.random() * 200), // Fallback price
        type: 'flight',
        provider: flight.airline || 'Various Airlines',
        bookingLink: 'https://www.google.com/travel/flights'
      };
    });

  } catch (error) {
    console.error('Error searching flights with AI:', error);
    // Fallback to generating realistic mock data
    return generateRealisticFlightData(origin, destination, date);
  }
}

/**
 * Estimate flight duration based on distance between locations
 */
function estimateFlightDuration(origin: Location, destination: Location): number {
  if (!origin.coordinates || !destination.coordinates) {
    return 3; // Default 3 hours if coordinates not available
  }

  const distance = calculateDistance(
    origin.coordinates.lat,
    origin.coordinates.lng,
    destination.coordinates.lat,
    destination.coordinates.lng
  );

  // Rough approximation: 500 km/h average speed + 1 hour for boarding/taxiing
  return Math.max(1, Math.round(distance / 500) + 1);
}

/**
 * Generate realistic flight data based on airports, distances, and typical schedules
 */
function generateRealisticFlightData(
  origin: Location,
  destination: Location,
  date: string
): TransportSegment[] {
  console.log(`Generating realistic flight data for ${origin.name} to ${destination.name} on ${date}`);

  const departureDate = new Date(date);
  const flightDuration = estimateFlightDuration(origin, destination);

  // Common departure times throughout the day
  const departureHours = [6, 8, 10, 12, 14, 16, 18, 20];

  // Major airlines appropriate for the route
  const airlines = determineAirlines(origin, destination);

  // Base price calculation based on distance and seasonality
  const basePrice = calculateBasePrice(origin, destination, departureDate);

  return departureHours.map((hour, index) => {
    const departureTime = new Date(departureDate);
    departureTime.setHours(hour, [0, 15, 30, 45][index % 4], 0);

    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(arrivalTime.getHours() + flightDuration);

    // Price variation by time of day (morning/evening flights more expensive)
    const timeMultiplier = (hour <= 8 || hour >= 18) ? 1.2 : 1.0;

    // Small random variation for each flight
    const priceVariation = 0.85 + (Math.random() * 0.3); // 0.85 to 1.15

    const price = Math.round(basePrice * timeMultiplier * priceVariation);

    const airline = airlines[index % airlines.length];

    return {
      id: `flight-${Date.now()}-${index}`,
      origin,
      destination,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      price,
      type: 'flight',
      provider: airline,
      bookingLink: 'https://example.com/book'
    };
  });
}

/**
 * Determine appropriate airlines based on route
 */
function determineAirlines(origin: Location, destination: Location): string[] {
  // Domestic US flights
  if (origin.name.includes('US') && destination.name.includes('US')) {
    return ['American Airlines', 'Delta Air Lines', 'United Airlines', 'Southwest Airlines', 'JetBlue'];
  }

  // Transatlantic
  if ((origin.name.includes('US') && destination.name.includes('Europe')) ||
    (origin.name.includes('Europe') && destination.name.includes('US'))) {
    return ['American Airlines', 'British Airways', 'Lufthansa', 'Air France', 'Delta Air Lines', 'United Airlines'];
  }

  // Asia routes
  if (origin.name.includes('Asia') || destination.name.includes('Asia')) {
    return ['Singapore Airlines', 'Cathay Pacific', 'ANA', 'Japan Airlines', 'Korean Air'];
  }

  // Default international airlines
  return ['American Airlines', 'British Airways', 'Emirates', 'Qatar Airways', 'Singapore Airlines', 'Lufthansa'];
}

/**
 * Calculate base price based on distance and seasonality
 */
function calculateBasePrice(origin: Location, destination: Location, date: Date): number {
  let basePrice = 100; // Starting price

  // Add distance factor
  if (origin.coordinates && destination.coordinates) {
    const distance = calculateDistance(
      origin.coordinates.lat,
      origin.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );

    // Roughly $0.10 per km with some economies of scale
    basePrice += Math.sqrt(distance) * 10;
  } else {
    // Default distance pricing if coordinates not available
    basePrice += 300;
  }

  // Seasonal adjustments
  const month = date.getMonth();

  // Summer and holiday season markup
  if (month >= 5 && month <= 7) { // Summer (Jun-Aug)
    basePrice *= 1.3;
  } else if (month === 11 || month === 0) { // Holiday season (Dec-Jan)
    basePrice *= 1.4;
  } else if (month >= 2 && month <= 4) { // Spring (Mar-May)
    basePrice *= 1.1;
  }

  return Math.round(basePrice);
}