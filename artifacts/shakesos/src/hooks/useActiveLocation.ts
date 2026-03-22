/**
 * useActiveLocation — continuously tracks and registers user's location.
 *
 * - Watches geolocation every few seconds
 * - Registers the user as "active" in the SOS service
 * - Returns current location and active status
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { sosService, type UserLocation } from "@/lib/sosService";

interface UseActiveLocationOptions {
  /** Enable/disable tracking. */
  enabled?: boolean;
  /** Interval in ms to push updates to the SOS service (default: 5000). */
  updateIntervalMs?: number;
}

interface ActiveLocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  isActive: boolean;
  userId: string;
}

/**
 * Generate or retrieve a stable user ID for this device/browser session.
 */
function getOrCreateUserId(): string {
  const key = "shakesos-user-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getUserPhone(): string {
  return localStorage.getItem("shakesos-contact") || "+910000000000";
}

function getUserName(): string {
  return localStorage.getItem("shakesos-contact-name") || "Me";
}

export function useActiveLocation({
  enabled = true,
  updateIntervalMs = 5000,
}: UseActiveLocationOptions = {}) {
  const userId = useRef(getOrCreateUserId()).current;

  const [state, setState] = useState<ActiveLocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    isActive: false,
    userId,
  });

  // Watch geolocation
  useEffect(() => {
    if (!enabled) {
      sosService.removeUser(userId);
      setState((s) => ({ ...s, isActive: false }));
      return;
    }

    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }

    let lastUpdate = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        const newAcc = pos.coords.accuracy;

        setState((s) => ({
          ...s,
          lat: newLat,
          lng: newLng,
          accuracy: newAcc,
          error: null,
          isActive: true,
        }));

        // Throttle service updates
        if (now - lastUpdate >= updateIntervalMs) {
          lastUpdate = now;
          const userLoc: UserLocation = {
            userId,
            lat: newLat,
            lng: newLng,
            phone: getUserPhone(),
            displayName: getUserName(),
            timestamp: now,
          };
          sosService.updateUserLocation(userLoc);
        }
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    // Mark active
    setState((s) => ({ ...s, isActive: true }));

    return () => {
      navigator.geolocation.clearWatch(watchId);
      sosService.removeUser(userId);
      setState((s) => ({ ...s, isActive: false }));
    };
  }, [enabled, userId, updateIntervalMs]);

  const getLocation = useCallback((): { lat: number; lng: number } | null => {
    if (state.lat !== null && state.lng !== null) {
      return { lat: state.lat, lng: state.lng };
    }
    return null;
  }, [state.lat, state.lng]);

  return {
    ...state,
    getLocation,
  };
}
