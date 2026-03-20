import { useState, useCallback } from "react";

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  error?: string;
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 0, lng: 0, error: "Geolocation not supported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setLocation({ lat: 0, lng: 0, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) return () => {};

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setLocation((prev) => prev ? { ...prev, error: err.message } : { lat: 0, lng: 0, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const getGoogleMapsLink = useCallback((loc: LocationData) => {
    return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
  }, []);

  return { location, requestLocation, watchLocation, getGoogleMapsLink };
}
