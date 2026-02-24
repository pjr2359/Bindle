"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Location } from '@/types/location';

interface LocationInputProps {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (name: string, value: string, location?: Location) => void;
  required?: boolean;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

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
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
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
      <label className="block text-gray-900 mb-2">{label}</label>
      <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
        <Search className="h-5 w-5 text-gray-800 mr-2" />
        <input
          ref={inputRef}
          type="text"
          name={name}
          placeholder={placeholder}
          className="w-full focus:outline-none text-gray-900"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          required={required}
          autoComplete="off"
        />
      </div>

      {isOpen && (loading || suggestions.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 text-sm">Searching…</div>
          ) : (
            suggestions.map((location) => (
              <div
                key={location.id}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                onClick={() => handleSelectSuggestion(location)}
              >
                <span className="mr-2">{getLocationTypeIcon(location.type)}</span>
                <div>
                  <div className="font-medium text-gray-900">{location.name}</div>
                  <div className="text-xs text-gray-900">{location.type.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;