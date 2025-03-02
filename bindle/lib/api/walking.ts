import { TransportSegment } from "@/types/segment";
import { Location } from "@/types/location";
import { getHereRoute } from "./services/hereService";
import { calculateDistance } from "./utils";

/**
 * Searches for a walking route between two locations
 * Always returns exactly one walking segment with current time as departure
 */
export async function searchWalks(
  origin: Location,
  destination: Location,
  date: string
): Promise<TransportSegment[]> {
  console.log(`Searching walks from ${origin.name} to ${destination.name} on ${date}`);
  try {
    // Format origin and destination for the HERE API
    const originStr = origin.coordinates 
      ? `${origin.coordinates.lat},${origin.coordinates.lng}` 
      : origin.name;
    
    const destinationStr = destination.coordinates 
      ? `${destination.coordinates.lat},${destination.coordinates.lng}` 
      : destination.name;
    
    // Get pedestrian route from HERE API
    let routeData;
    try {
      routeData = await getHereRoute(originStr, destinationStr, 'pedestrian');
      
      // Return mock data if no routes found
      if (!routeData.routes || routeData.routes.length === 0) {
        console.log('No routes found from HERE API, using mock data instead');
        return createSingleWalkSegment(origin, destination);
      }
    } catch (error) {
      console.log('HERE API error, using mock data instead:', error);
      return createSingleWalkSegment(origin, destination);
    }
    
    // Process the first route only
    const route = routeData.routes[0];
    
    // Calculate total duration from all pedestrian sections
    let totalDurationInSeconds = 0;
    if (route.sections && route.sections.length > 0) {
      for (const section of route.sections) {
        if (section.type && section.type !== 'pedestrian') continue;
        totalDurationInSeconds += section.summary?.duration || 0;
      }
    } else {
      // If no sections or duration info, use mock data
      return createSingleWalkSegment(origin, destination);
    }
    
    // Create a single walking segment
    const departureTime = new Date(); // Use current time
    const arrivalTime = new Date(departureTime.getTime() + totalDurationInSeconds * 1000);
    
    // Create a unique ID
    const segmentId = `walk-${Date.now()}`;
    
    // Return exactly one segment
    return [{
      id: segmentId,
      origin: origin,
      destination: destination,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      price: 0, // Walking is free
      type: 'bus', // Using 'bus' as the closest option from allowed types
      provider: 'Walking',
      bookingLink: '' // No booking link for walking
    }];
  } catch (error) {
    console.error('Error searching for walks:', error);
    return createSingleWalkSegment(origin, destination);
  }
}

/**
 * Creates a single walking segment with an estimated duration based on distance
 */
function createSingleWalkSegment(origin: Location, destination: Location): TransportSegment[] {
  console.log(`Creating a single walking segment from ${origin.name} to ${destination.name}`);
  
  // Calculate estimated walking time based on coordinates if available
  let walkingTimeMinutes = 30; // Default time of 30 minutes
  
  if (origin.coordinates && destination.coordinates) {
    // Calculate distance using the Haversine formula
    const distance = calculateDistance(
      origin.coordinates.lat, 
      origin.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );
    
    // Estimate walking time based on average walking speed of 5 km/h
    // Add 20% to account for non-straight paths and stops
    walkingTimeMinutes = Math.ceil((distance / 5) * 60 * 1.2);
    
    // Ensure minimum and maximum reasonable walking times
    walkingTimeMinutes = Math.max(5, Math.min(180, walkingTimeMinutes));
  }
  
  // Use current time as departure time
  const departureTime = new Date();
  const arrivalTime = new Date(departureTime.getTime() + walkingTimeMinutes * 60 * 1000);
  
  // Create a unique ID
  const segmentId = `walk-mock-${Date.now()}`;
  
  // Return exactly one segment
  return [{
    id: segmentId,
    origin: origin,
    destination: destination,
    departureTime: departureTime.toISOString(),
    arrivalTime: arrivalTime.toISOString(),
    price: 0, // Walking is free
    type: 'bus', // Using 'bus' as allowed type (since 'walk' isn't in the interface)
    provider: 'Walking (Estimated)',
    bookingLink: '' // No booking link for walking
  }];
}
