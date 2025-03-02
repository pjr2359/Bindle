"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import RouteCard, { RouteCardProps } from "@/app/results/RouteCard";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("cheapest");
  const [results, setResults] = useState<RouteCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  interface Journey {
    id: number;
    totalPrice: number;
    totalDuration: number;
    segments: {
      type: "flight" | "train" | "bus";
      origin: { name: string };
      destination: { name: string };
      departureTime: string;
      arrivalTime: string;
      provider: string;
      price: number;
    }[];
  }

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);

      try {
        const originId = searchParams.get("originId");
        const destinationId = searchParams.get("destinationId");
        const departureDate = searchParams.get("departureDate");

        if (originId && destinationId && departureDate) {
          const queryParams = new URLSearchParams(searchParams.toString());
          const response = await fetch(`/api/search?${queryParams.toString()}`);
          const data: { routes: Journey[] } = await response.json();

          if (data.routes) {
            setResults(
              data.routes.map((journey: Journey) => ({
                id: journey.id,
                price: journey.totalPrice,
                duration: journey.totalDuration,
                segments: journey.segments.map((segment) => ({
                  type: segment.type as "flight" | "train" | "bus",
                  origin: segment.origin.name,
                  destination: segment.destination.name,
                  departureTime: segment.departureTime,
                  arrivalTime: segment.arrivalTime,
                  provider: segment.provider,
                  price: segment.price,
                })),
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [searchParams]);

  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {origin} to {destination}
              </h2>
              <p className="text-gray-700">
                {searchParams.get("departureDate") || "Anytime"} • 1 traveler
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md hover:bg-blue-200"
            >
              Modify Search
            </button>
          </div>

          <div className="flex border-b mb-6">
            <button
              className={`pb-3 px-4 ${
                activeTab === "cheapest"
                  ? "border-b-2 border-blue-600 text-blue-800 font-medium"
                  : "text-gray-700"
              }`}
              onClick={() => setActiveTab("cheapest")}
            >
              Cheapest
            </button>
            <button
              className={`pb-3 px-4 ${
                activeTab === "fastest"
                  ? "border-b-2 border-blue-600 text-blue-800 font-medium"
                  : "text-gray-700"
              }`}
              onClick={() => setActiveTab("fastest")}
            >
              Fastest
            </button>
            <button
              className={`pb-3 px-4 ${
                activeTab === "recommended"
                  ? "border-b-2 border-blue-600 text-blue-800 font-medium"
                  : "text-gray-700"
              }`}
              onClick={() => setActiveTab("recommended")}
            >
              Recommended
            </button>
          </div>

          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-700">Finding the cheapest routes...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <RouteCard
                  key={result.id}
                  id={result.id}
                  price={result.price}
                  duration={result.duration}
                  segments={result.segments}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-700">
                  No routes found. Try modifying your search.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Travel Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Transit Between Stations
              </h4>
              <p className="text-gray-700">
                Remember to allow enough time for transfers between different
                transportation hubs in the same city.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Baggage Considerations
              </h4>
              <p className="text-gray-700">
                Multi-modal journeys may have different baggage allowances for
                each segment. Check the policies before booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}