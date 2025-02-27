import React from 'react';
import SearchForm from '@/components/search/SearchForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Find the absolute cheapest way to travel</h1>
          <p className="text-lg text-gray-600">Combine flights, trains, buses and more to save money</p>
        </div>

        <SearchForm />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
            <h3 className="font-bold text-lg mb-2">Multi-modal Journeys</h3>
            <p className="text-gray-600">We combine trains, buses, flights and more to find the absolute cheapest route.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
            <h3 className="font-bold text-lg mb-2">Budget Focused</h3>
            <p className="text-gray-600">Bindle specializes in finding unconventional but super affordable travel options.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
            <h3 className="font-bold text-lg mb-2">Trip Planning</h3>
            <p className="text-gray-600">Plan complex multi-destination trips with our advanced planning features.</p>
          </div>
        </div>
      </main>
    </div>
  );
}