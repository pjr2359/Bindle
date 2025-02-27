import { TransportSegment } from '@/types/segment';
import { Location } from '@/types/location';

// Interface for graph nodes
export interface GraphNode {
  locationId: string;
  time: Date;
}

// Interface for routing graph
export interface RoutingGraph {
  [nodeKey: string]: TransportSegment[];
}

// Generate a unique key for a node
export function nodeKey(locationId: string, time: Date): string {
  return `${locationId}:${time.toISOString()}`;
}

// Build a graph representation of all possible routes
export function buildRoutingGraph(segments: TransportSegment[]): RoutingGraph {
  const graph: RoutingGraph = {};

  for (const segment of segments) {
    const originId = segment.origin.id;
    const departureTime = new Date(segment.departureTime);
    const key = nodeKey(originId, departureTime);

    if (!graph[key]) {
      graph[key] = [];
    }

    graph[key].push(segment);
  }

  return graph;
}

// Calculate the transfer time between two locations (simplified)
export function calculateTransferTime(location1: Location, location2: Location): number {
  // In a real app, you'd use distance calculation and estimated transit time
  // For MVP, use simplified logic
  if (location1.id === location2.id) return 0;

  // Same city but different locations (e.g., airport to train station)
  if (location1.name.includes(location2.name) || location2.name.includes(location1.name)) {
    return 60; // 60 minutes
  }

  // Default transfer time between different cities
  return 120; // 2 hours
}