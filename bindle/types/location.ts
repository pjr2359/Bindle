export interface Location {
  id: string;
  name: string;
  type: 'airport' | 'train_station' | 'bus_station' | 'city';
  coordinates?: {
    lat: number;
    lng: number;
  };
}