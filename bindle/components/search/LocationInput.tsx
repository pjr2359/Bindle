"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchLocations } from '@/lib/utils/geo';
import { Location } from '@/types/location';

interface LocationInputProps {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (name: string, value: string, location?: Location) => void;
  required?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required = false
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      const results = await searchLocations(query);
      setSuggestions(results);
    };

    getSuggestions();
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    onChange(name, value);
  };

  const handleSelectSuggestion = (location: Location) => {
    setQuery(location.name);
    setSelectedLocation(location);
    setSuggestions([]);
    setIsOpen(false);
    onChange(name, location.name, location);
  };

  const handleBlur = () => {
    // Delay closing the suggestions to allow for clicks
    setTimeout(() => setIsOpen(false), 200);
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'airport':
        return '✈️';
      case 'train_station':
        return '🚄';
      case 'bus_station':
        return '🚌';
      case 'city':
      default:
        return '🏙️';
    }
  };

  return (
    <div className="relative">
      <label className="block text-gray-700 mb-2">{label}</label>
      <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
        <Search className="h-5 w-5 text-gray-400 mr-2" />
        <input
          ref={inputRef}
          type="text"
          name={name}
          placeholder={placeholder}
          className="w-full focus:outline-none"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          required={required}
          autoComplete="off"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((location) => (
            <div
              key={location.id}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
              onClick={() => handleSelectSuggestion(location)}
            >
              <span className="mr-2">{getLocationTypeIcon(location.type)}</span>
              <div>
                <div className="font-medium">{location.name}</div>
                <div className="text-xs text-gray-500">{location.type.replace('_', ' ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;