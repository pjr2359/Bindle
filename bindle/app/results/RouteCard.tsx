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
  ExternalLink,
} from "lucide-react";
import { formatDuration, formatTime, formatDate, formatArrivalDayOffset } from "@/lib/utils/date";
import { getAirlineName } from "@/lib/utils/airlines";
import { getFlightBookingLinks } from "@/lib/utils/bookingLinks";

const transportIcon = {
  flight: <Plane className="h-5 w-5" />,
  train: <Train className="h-5 w-5" />,
  bus: <Bus className="h-5 w-5" />,
};

export type SegmentOriginDestination =
  | string
  | { name: string; skyId?: string; type?: string };

export interface Segment {
  type: "flight" | "train" | "bus";
  origin: SegmentOriginDestination;
  destination: SegmentOriginDestination;
  departureTime: string;
  arrivalTime: string;
  arrivalDayOffset?: number;
  provider: string;
  price: number;
  bookingLink?: string;
  isDirect?: boolean;
}

export interface RouteCardProps {
  id: number | string;
  price: number;
  duration: number;
  segments: Segment[];
}

function formatPlaceLabel(place: SegmentOriginDestination): string {
  if (typeof place === "string") return place;
  const name = place.name || "";
  const code = place.skyId;
  const displayName = name.includes(":")
    ? name.split(":")[1]?.trim() || name
    : name.split("/")[0]?.trim() || name;
  const title = displayName
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(Us|Gb|Ny)\b/gi, (m) => m.toUpperCase());
  return code ? `${title} (${code})` : title;
}

const RouteCard = ({ id, price, duration, segments }: RouteCardProps) => {
  const firstSegment = segments[0];
  const isFlight = firstSegment?.type === "flight";
  const bookingOptions =
    isFlight &&
    typeof firstSegment.origin === "object" &&
    typeof firstSegment.destination === "object"
      ? getFlightBookingLinks(
          firstSegment.origin,
          firstSegment.destination,
          firstSegment.departureTime
        )
      : [];
  const legacyLink = segments.find((s) => s.bookingLink)?.bookingLink;
  const isMultiSegment = segments.length > 1;

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">
                  ${Number(price).toFixed(2)}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-slate-900">
                  {formatDuration(duration)}
                </p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Total time
                </p>
              </div>
            </div>
            {isFlight && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  firstSegment.isDirect === false
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {firstSegment.isDirect === false
                  ? isMultiSegment
                    ? `${segments.length} stops`
                    : "1 stop"
                  : "Direct"}
              </span>
            )}
          </div>

          {/* Booking links */}
          <div className="flex flex-col items-end gap-2">
            {bookingOptions.length > 0 ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {bookingOptions.map((opt) => (
                  <a
                    key={opt.label}
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 transition-colors"
                  >
                    {opt.label}
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                ))}
              </div>
            ) : legacyLink ? (
              <a
                href={legacyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 transition-colors"
              >
                View on Amadeus
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            ) : null}
            <p className="text-xs text-slate-500 max-w-[200px] text-right">
              Opens search to compare & book
            </p>
          </div>
        </div>
      </div>

      {/* Segments */}
      <div className="divide-y divide-slate-100">
        {segments.map((segment, idx) => {
          const airlineName = segment.type === "flight" ? getAirlineName(segment.provider) : segment.provider;
          return (
            <div key={idx} className="px-6 py-5">
              <div className="flex gap-4">
                <div
                  className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${
                    segment.type === "flight"
                      ? segment.isDirect === false
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                      : segment.type === "train"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {transportIcon[segment.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatTime(segment.departureTime)} – {formatTime(segment.arrivalTime)}
                        {segment.arrivalDayOffset != null && (
                          <span className="ml-1.5 text-sm font-normal text-slate-500">
                            ({formatArrivalDayOffset(segment.arrivalDayOffset)} day)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatDate(segment.departureTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">${segment.price.toFixed(2)}</p>
                      <p className="text-sm font-medium text-slate-600">{airlineName}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-medium text-slate-700">
                        From: <span className="text-slate-900">{formatPlaceLabel(segment.origin)}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">
                        To: <span className="text-slate-900">{formatPlaceLabel(segment.destination)}</span>
                      </span>
                    </div>
                    {segment.type === "flight" && segment.isDirect === false && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Indirect flight (includes stop)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex justify-end gap-4">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Bookmark className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
};

export default RouteCard;
