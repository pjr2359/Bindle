"use client";

import React, { useState } from 'react';
import { Search, Map, Calendar, DollarSign, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert to URL params and navigate to results page
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 mb-2">Origin</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
              <Search className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="origin"
                placeholder="City, airport, station..."
                className="w-full focus:outline-none"
                value={searchParams.origin}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Destination</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
              <Search className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="destination"
                placeholder="City, airport, station..."
                className="w-full focus:outline-none"
                value={searchParams.destination}
                onChange={handleChange}
                required
              />
            </div>
          </div>
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