"use client";

import React, { useState } from 'react';
import { Calendar, DollarSign, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LocationInput from './LocationInput';
import { Location } from '@/types/location';

const SearchForm = () => {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    maxPrice: '',
    maxDuration: ''
  });

  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (name: string, value: string, location?: Location) => {
    setSearchParams(prev => ({ ...prev, [name]: value }));

    if (location) {
      if (name === 'origin') {
        setOriginLocation(location);
      } else if (name === 'destination') {
        setDestinationLocation(location);
      }
    }
  };

  const handleSubmit = (e:any) => {
    e.preventDefault();

    // Build the query parameters including location IDs if available
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    // Add location IDs if available
    if (originLocation) params.append('originId', originLocation.id);
    if (destinationLocation) params.append('destinationId', destinationLocation.id);

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <LocationInput
            name="origin"
            label="Origin"
            placeholder="City, airport, station..."
            value={searchParams.origin}
            onChange={handleLocationChange}
            required
          />

          <LocationInput
            name="destination"
            label="Destination"
            placeholder="City, airport, station..."
            value={searchParams.destination}
            onChange={handleLocationChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Departure Date</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="date"
                name="departureDate"
                className="w-full focus:outline-none"
                value={searchParams.departureDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Return Date (Optional)</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="date"
                name="returnDate"
                className="w-full focus:outline-none"
                value={searchParams.returnDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Max Price (USD)</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="number"
                name="maxPrice"
                placeholder="Any price"
                className="w-full focus:outline-none"
                value={searchParams.maxPrice}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Max Duration (hrs)</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="number"
                name="maxDuration"
                placeholder="Any duration"
                className="w-full focus:outline-none"
                value={searchParams.maxDuration}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
          >
            Find Cheapest Routes
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;