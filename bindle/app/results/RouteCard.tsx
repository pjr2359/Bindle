"use client";

import React from "react";
import {
  ArrowRight,
  Plane,
  Train,
  Bus,
  Clock,
  DollarSign,
  Share2,
  Bookmark,
} from "lucide-react";
import { formatDuration, formatTime, formatDate } from "@/lib/utils/date";

const transportIcon = {
  flight: <Plane className="h-5 w-5" />,
  train: <Train className="h-5 w-5" />,
  bus: <Bus className="h-5 w-5" />,
};

export interface Segment {
  type: "flight" | "train" | "bus";
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  provider: string;
  price: number;
}

export interface RouteCardProps {
  id: number | string;
  price: number;
  duration: number; // in minutes
  segments: Segment[];
}

const RouteCard = ({ id, price, duration, segments }: RouteCardProps) => {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center">
            <DollarSign className="h-5 w-5 text-green-700" />
            <span className="text-lg font-bold text-gray-900">${price}</span>
            <span className="text-xs text-gray-700">Total</span>
          </div>

          <div className="flex flex-col items-center">
            <Clock className="h-5 w-5 text-blue-700" />
            <span className="text-lg font-bold text-gray-900">
              {formatDuration(duration)}
            </span>
            <span className="text-xs text-gray-700">Total Time</span>
          </div>

          <div className="flex items-center space-x-2">
            {segments.map((segment, idx) => (
              <React.Fragment key={idx}>
                <div
                  className={`rounded-full p-1 ${
                    segment.type === "flight"
                      ? "bg-blue-100 text-blue-700"
                      : segment.type === "train"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {transportIcon[segment.type]}
                </div>
                {idx < segments.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
          <button className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-6 rounded-md transition-colors">
            View Deal
          </button>
        </div>
      </div>

      <div className="divide-y">
        {segments.map((segment, idx) => (
          <div key={idx} className="px-6 py-4">
            <div className="flex items-start">
              <div
                className={`mr-4 rounded-full p-2 ${
                  segment.type === "flight"
                    ? "bg-blue-100 text-blue-700"
                    : segment.type === "train"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {transportIcon[segment.type]}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatTime(segment.departureTime)} - {formatTime(segment.arrivalTime)}
                    </div>
                    <div className="text-gray-800">{formatDate(segment.departureTime)}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-gray-900">${segment.price}</div>
                    <div className="text-sm text-gray-700">{segment.provider}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-700"></div>
                    <div className="h-px w-24 bg-gray-400 mx-2"></div>
                    <div className="h-2 w-2 rounded-full bg-blue-700"></div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {segment.origin} to {segment.destination}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 px-6 py-3 border-t flex justify-end space-x-4">
        <button className="flex items-center text-gray-700 hover:text-blue-700">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </button>
        <button className="flex items-center text-gray-700 hover:text-blue-700">
          <Bookmark className="h-4 w-4 mr-1" />
          Save
        </button>
      </div>
    </div>
  );
};

export default RouteCard;