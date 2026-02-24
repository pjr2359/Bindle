import { Location } from './location';

export interface TransportSegment {
  id: string;
  origin: Location;
  destination: Location;
  departureTime: string;
  arrivalTime: string;
  /** For flights: +1, +2, +3 or -1 when arrival is on a different day than departure */
  arrivalDayOffset?: number;
  price: number;
  type: 'flight' | 'train' | 'bus' | 'walk';
  provider: string;
  bookingLink: string;
  /** If set, flight has stopovers (indirect); used for styling */
  isDirect?: boolean;
}