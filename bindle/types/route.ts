import { Location } from './location';
import { TransportSegment } from './segment';

export interface Journey {
  id: string;
  segments: TransportSegment[];
  totalPrice: number;
  totalDuration: number; // in minutes
  transfers: number;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  maxPrice?: number;
  maxDuration?: number;
  travelers?: number;
}