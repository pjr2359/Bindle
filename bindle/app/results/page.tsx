"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import RouteCard, { RouteCardProps } from "@/app/results/RouteCard";
import { ArrowLeft, Plane, Sparkles } from "lucide-react";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"cheapest" | "fastest" | "recommended">("cheapest");
  const [results, setResults] = useState<RouteCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  interface Journey {
    id: number;
    totalPrice: number;
    totalDuration: number;
    segments: {
      type: "flight" | "train" | "bus";
      origin: { name: string; skyId?: string; type?: string };
      destination: { name: string; skyId?: string; type?: string };
      departureTime: string;
      arrivalTime: string;
      arrivalDayOffset?: number;
      provider: string;
      price: number;
      bookingLink?: string;
      isDirect?: boolean;
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
                  origin: {
                    name: segment.origin.name,
                    skyId: segment.origin.skyId,
                    type: segment.origin.type,
                  },
                  destination: {
                    name: segment.destination.name,
                    skyId: segment.destination.skyId,
                    type: segment.destination.type,
                  },
                  departureTime: segment.departureTime,
                  arrivalTime: segment.arrivalTime,
                  arrivalDayOffset: segment.arrivalDayOffset,
                  provider: segment.provider,
                  price: segment.price,
                  bookingLink: segment.bookingLink,
                  isDirect: segment.isDirect,
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
  const departureDate = searchParams.get("departureDate") || "";

  const sortedResults = useMemo(() => {
    if (activeTab === "fastest") {
      return [...results].sort((a, b) => a.duration - b.duration || a.price - b.price);
    }
    return [...results].sort((a, b) => a.price - b.price || a.duration - b.duration);
  }, [results, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        {/* Header card */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                {origin} → {destination}
              </h1>
              <p className="mt-1 text-slate-600">
                {departureDate || "Anytime"} · 1 traveler
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Modify search
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 p-1 rounded-xl bg-slate-100/80 w-fit">
            {(
              [
                { id: "cheapest" as const, label: "Cheapest" },
                { id: "fastest" as const, label: "Fastest" },
                { id: "recommended" as const, label: "Recommended" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 mb-4">
                <Plane className="h-7 w-7 animate-pulse" />
              </div>
              <p className="text-slate-700 font-medium">Finding the best routes…</p>
              <p className="text-sm text-slate-500 mt-1">This may take a few seconds</p>
            </div>
          ) : sortedResults.length > 0 ? (
            sortedResults.map((result) => (
              <RouteCard
                key={result.id}
                id={result.id}
                price={result.price}
                duration={result.duration}
                segments={result.segments}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="text-lg font-semibold text-slate-900">No routes found</p>
              <p className="text-slate-600 mt-2 text-sm max-w-md mx-auto">
                Make sure <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">AMADEUS_CLIENT_ID</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">AMADEUS_CLIENT_SECRET</code> are set in your <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono text-xs">.env</code>. If they are, Amadeus may be rate-limiting—wait a moment and try again—or check the server console for errors.
              </p>
            </div>
          )}
        </div>

        {/* Travel tips */}
        <div className="mt-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Travel tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4">
              <h4 className="font-medium text-slate-900 mb-1.5">Transit between stations</h4>
              <p className="text-sm text-slate-600">
                Allow enough time for transfers between different transport hubs in the same city.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4">
              <h4 className="font-medium text-slate-900 mb-1.5">Baggage</h4>
              <p className="text-sm text-slate-600">
                Multi-modal journeys can have different baggage rules per segment. Check each provider before booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
