/**
 * VolunteerTracker — shows incoming volunteers on the victim's SOS screen.
 *
 * Displays each helper with their distance, status, and a Google Maps link.
 * Features a count badge and live "on the way" status updates.
 */

import type { VolunteerInfo } from "@/lib/sosService";

interface VolunteerTrackerProps {
  volunteers: VolunteerInfo[];
  nearbyCount: number;
}

export default function VolunteerTracker({
  volunteers,
  nearbyCount,
}: VolunteerTrackerProps) {
  if (nearbyCount === 0 && volunteers.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤝</span>
          <h3 className="text-sm font-bold text-white">Community Support</h3>
        </div>
        <div className="flex items-center gap-2">
          {nearbyCount > 0 && (
            <span className="text-[10px] text-gray-500">
              {nearbyCount} nearby
            </span>
          )}
          {volunteers.length > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {volunteers.length}
            </span>
          )}
        </div>
      </div>

      {/* Volunteer List */}
      {volunteers.length > 0 ? (
        <div className="space-y-2">
          {volunteers.map((vol) => (
            <div
              key={vol.helperId}
              className="flex items-center gap-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-3 py-2.5 fade-in"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-sm font-bold text-white">
                  {(vol.displayName || "?").charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-gray-900" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {vol.displayName || "Volunteer"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {vol.status === "on_the_way"
                      ? "🏃 On the way"
                      : vol.status === "arrived"
                      ? "✅ Arrived"
                      : "✓ Accepted"}
                  </span>
                  <span className="text-[10px] text-gray-600">•</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ~{vol.distance}m
                  </span>
                </div>
              </div>

              {/* Call Button */}
              <a
                href={`tel:${vol.phone}`}
                className="flex-shrink-0 rounded-lg bg-emerald-600/20 border border-emerald-700/30 p-2 text-emerald-400 transition-all active:scale-90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-500 font-medium">
              Notifying {nearbyCount} nearby users...
            </span>
          </div>
          <p className="text-[10px] text-gray-600">
            Volunteers will appear here when they accept
          </p>
        </div>
      )}
    </div>
  );
}
