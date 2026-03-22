import { useState, useCallback, useRef, useEffect } from "react";

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  error?: string;
  isSimulated?: boolean;
}

// ── Demo / fallback coordinates ──────────────────────────────────────────────
// Kolkata, India — a realistic demo location.  Change if you need another city.
const DEMO_LAT = 22.5726;
const DEMO_LNG = 88.3639;
const DEMO_ACCURACY = 15; // meters

/**
 * Slightly jitter coordinates so successive "updates" look realistic.
 */
function jitter(base: number, range = 0.0003): number {
  return base + (Math.random() - 0.5) * range;
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Try real geolocation first.  If it fails or times out within 4 seconds,
   * fall back to simulated demo coordinates so the app never gets stuck.
   */
  const requestLocation = useCallback(() => {
    // Start a 4-second race — if the browser doesn't deliver in time we fallback
    fallbackTimerRef.current = setTimeout(() => {
      setLocation((prev) => {
        // Only set fallback if we haven't received a real position yet
        if (!prev || prev.error || (prev.lat === 0 && prev.lng === 0)) {
          return {
            lat: jitter(DEMO_LAT),
            lng: jitter(DEMO_LNG),
            accuracy: DEMO_ACCURACY,
            isSimulated: true,
          };
        }
        return prev;
      });
    }, 4000);

    if (!navigator.geolocation) {
      // No API at all — go straight to fallback
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      setLocation({
        lat: jitter(DEMO_LAT),
        lng: jitter(DEMO_LNG),
        accuracy: DEMO_ACCURACY,
        isSimulated: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (_err) => {
        // Error → use fallback immediately
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setLocation({
          lat: jitter(DEMO_LAT),
          lng: jitter(DEMO_LNG),
          accuracy: DEMO_ACCURACY,
          isSimulated: true,
        });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  const watchLocation = useCallback(() => {
    // If geolocation is available, try real watch
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (_err) => {
          // On error switch to simulated updates
          startSimulatedWatch();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
      watchIdRef.current = id;

      // Also set a 4s fallback in case watchPosition never fires
      const fb = setTimeout(() => {
        setLocation((prev) => {
          if (!prev || prev.error || (prev.lat === 0 && prev.lng === 0)) {
            return {
              lat: jitter(DEMO_LAT),
              lng: jitter(DEMO_LNG),
              accuracy: DEMO_ACCURACY,
              isSimulated: true,
            };
          }
          return prev;
        });
      }, 4000);

      return () => {
        clearTimeout(fb);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    }

    // No geolocation API — pure simulation
    startSimulatedWatch();
    return () => {
      if (watchIdRef.current !== null) {
        clearInterval(watchIdRef.current as unknown as number);
        watchIdRef.current = null;
      }
    };
  }, []);

  /** Simulate location updates every 5 seconds with small jitter */
  function startSimulatedWatch() {
    setLocation({
      lat: jitter(DEMO_LAT),
      lng: jitter(DEMO_LNG),
      accuracy: DEMO_ACCURACY,
      isSimulated: true,
    });
    const interval = setInterval(() => {
      setLocation({
        lat: jitter(DEMO_LAT),
        lng: jitter(DEMO_LNG),
        accuracy: DEMO_ACCURACY,
        isSimulated: true,
      });
    }, 5000);
    watchIdRef.current = interval as unknown as number;
  }

  const getGoogleMapsLink = useCallback((loc: LocationData) => {
    return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  return { location, requestLocation, watchLocation, getGoogleMapsLink };
}
