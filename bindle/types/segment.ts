import { Location } from './location';

export interface TransportSegment {
  id: string;
  origin: Location;
  destination: Location;
  departureTime: string;
  arrivalTime: string;
  price: number;
  type: 'flight' | 'train' | 'bus' | 'walk';
  provider: string;
  bookingLink: string;
}