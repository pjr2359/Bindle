// types/location.ts
export interface Location {
  id: string;
  name: string;
  type: 'airport' | 'train_station' | 'bus_station' | 'city';
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Skyscanner-specific IDs
  skyId?: string;
  entityId?: string;
  // Rail-specific IDs
  railId?: string;
  stationId?: string;
  // Bus-specific IDs
  busId?: string;
  terminalId?: string;
}