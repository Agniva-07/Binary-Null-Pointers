import { LocationData } from "@/hooks/useGeolocation";

interface LocationDisplayProps {
  location: LocationData | null;
}

export default function LocationDisplay({ location }: LocationDisplayProps) {
  if (!location) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📍</span>
          <span className="text-sm text-gray-500">Getting location...</span>
        </div>
      </div>
    );
  }

  if (location.error && location.lat === 0) {
    return (
      <div className="rounded-xl border border-yellow-800/40 bg-yellow-950/20 p-3">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span className="text-sm text-yellow-400">Location unavailable: {location.error}</span>
        </div>
      </div>
    );
  }

  const mapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

  return (
    <div className="rounded-xl border border-green-800/40 bg-green-950/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-green-400">📍</span>
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Location Active</span>
          </div>
          <p className="text-xs text-gray-400 font-mono">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
          {location.accuracy && (
            <p className="text-xs text-gray-500 mt-0.5">±{Math.round(location.accuracy)}m accuracy</p>
          )}
        </div>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 rounded-lg bg-green-700/30 border border-green-700/40 px-2.5 py-1.5 text-xs font-medium text-green-400"
        >
          Maps →
        </a>
      </div>
    </div>
  );
}
