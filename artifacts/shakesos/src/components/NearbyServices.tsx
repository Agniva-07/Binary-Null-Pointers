import { useState, useEffect, useCallback } from "react";

interface EmergencyService {
  id: string;
  name: string;
  type: "hospital" | "police" | "fire" | "shelter";
  distance: number; // meters
  lat: number;
  lng: number;
  phone?: string;
  address?: string;
}

const SERVICE_TYPES = {
  hospital: { label: "Hospital", emoji: "🏥", color: "text-blue-400", bg: "bg-blue-950/20", border: "border-blue-800/40" },
  police: { label: "Police", emoji: "🚔", color: "text-red-400", bg: "bg-red-950/20", border: "border-red-800/40" },
  fire: { label: "Fire Station", emoji: "🚒", color: "text-orange-400", bg: "bg-orange-950/20", border: "border-orange-800/40" },
  shelter: { label: "Shelter", emoji: "🏠", color: "text-green-400", bg: "bg-green-950/20", border: "border-green-800/40" },
};

// Mock nearby services generator
function generateMockServices(lat: number, lng: number): EmergencyService[] {
  const services: EmergencyService[] = [];
  const names: Record<string, string[]> = {
    hospital: ["City General Hospital", "St. Mary's Medical Center", "District Health Clinic", "Emergency Care Center"],
    police: ["Central Police Station", "City North Police HQ", "Traffic Police Office"],
    fire: ["Fire Station #1", "Metro Fire & Rescue", "Emergency Response Center"],
    shelter: ["Safe Haven Shelter", "Women's Crisis Center", "Community Emergency Refuge"],
  };

  (Object.keys(names) as Array<keyof typeof names>).forEach((type) => {
    names[type].forEach((name, i) => {
      const dist = 200 + Math.random() * 4800; // 200m - 5km
      const angle = Math.random() * 2 * Math.PI;
      const dLat = (dist * Math.cos(angle)) / 111320;
      const dLng = (dist * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));

      services.push({
        id: `${type}-${i}`,
        name,
        type: type as EmergencyService["type"],
        distance: Math.round(dist),
        lat: lat + dLat,
        lng: lng + dLng,
        phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        address: `${Math.floor(1 + Math.random() * 200)}, ${["Main Road", "MG Road", "Station Road", "Gandhi Nagar", "Civil Lines"][Math.floor(Math.random() * 5)]}`,
      });
    });
  });

  return services.sort((a, b) => a.distance - b.distance);
}

interface NearbyServicesProps {
  onBack: () => void;
}

export default function NearbyServices({ onBack }: NearbyServicesProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [filter, setFilter] = useState<EmergencyService["type"] | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user location and generate mock services
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setServices(generateMockServices(loc.lat, loc.lng));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        // Fallback: simulate with a default location
        const defaultLoc = { lat: 28.6139, lng: 77.209 }; // Delhi
        setLocation(defaultLoc);
        setServices(generateMockServices(defaultLoc.lat, defaultLoc.lng));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const filteredServices = filter === "all" ? services : services.filter((s) => s.type === filter);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const openInMaps = useCallback((service: EmergencyService) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`;
    window.open(url, "_blank");
  }, []);

  const callService = useCallback((phone: string) => {
    window.open(`tel:${phone}`, "_self");
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 py-8 pb-24">
      <div className="w-full max-w-sm mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          ← Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">🏥 Nearby Services</h1>
          <p className="text-sm text-gray-400">
            Find hospitals, police stations, and shelters near you.
          </p>
          {location && (
            <p className="text-xs text-gray-500 mt-1 font-mono">
              📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Emergency Numbers */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            { number: "112", label: "Emergency", emoji: "🆘" },
            { number: "100", label: "Police", emoji: "🚔" },
            { number: "102", label: "Ambulance", emoji: "🚑" },
          ].map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-red-800/40 bg-red-950/20 p-3 transition-all active:scale-95"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-lg font-black text-red-400">{item.number}</span>
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </a>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === "all" ? "bg-gray-700 text-white" : "bg-gray-800/50 text-gray-500"
            }`}
          >
            All
          </button>
          {(Object.keys(SERVICE_TYPES) as Array<keyof typeof SERVICE_TYPES>).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === type ? "bg-gray-700 text-white" : "bg-gray-800/50 text-gray-500"
              }`}
            >
              {SERVICE_TYPES[type].emoji} {SERVICE_TYPES[type].label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-gray-700 border-t-red-500 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Finding nearby services...</p>
          </div>
        )}

        {error && !loading && (
          <div className="mb-4 rounded-xl border border-yellow-800/40 bg-yellow-950/20 p-3">
            <p className="text-xs text-yellow-400">
              ⚠️ Location: {error}. Showing approximate results.
            </p>
          </div>
        )}

        {/* Services List */}
        {!loading && (
          <div className="space-y-3">
            {filteredServices.map((service) => {
              const typeInfo = SERVICE_TYPES[service.type];
              return (
                <div
                  key={service.id}
                  className={`rounded-2xl border ${typeInfo.border} ${typeInfo.bg} p-4 fade-in`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="text-xl mt-0.5">{typeInfo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {service.name}
                        </p>
                        {service.address && (
                          <p className="text-xs text-gray-500 truncate">{service.address}</p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-mono font-bold ${typeInfo.color}`}>
                      {formatDistance(service.distance)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openInMaps(service)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/60 py-2 text-xs font-medium text-gray-300 transition-all active:scale-95"
                    >
                      📍 Directions
                    </button>
                    {service.phone && (
                      <button
                        onClick={() => callService(service.phone!)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-700/30 border border-green-700/40 py-2 text-xs font-medium text-green-400 transition-all active:scale-95"
                      >
                        📞 Call
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredServices.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No services found for this filter.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
