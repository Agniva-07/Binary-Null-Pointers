/**
 * useActiveLocation — continuously tracks and registers user's location.
 *
 * - Watches geolocation every few seconds
 * - Falls back to simulated demo coordinates when real GPS is unavailable
 * - Registers the user as "active" in the SOS service
 * - Returns current location and active status
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { sosService, type UserLocation } from "@/lib/sosService";

// ── Demo fallback ────────────────────────────────────────────────────────────
const DEMO_LAT = 22.5726;
const DEMO_LNG = 88.3639;

function jitter(base: number, range = 0.0003): number {
  return base + (Math.random() - 0.5) * range;
}

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
  isSimulated: boolean;
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
    isSimulated: false,
  });

  // Watch geolocation — with fallback to simulated coords
  useEffect(() => {
    if (!enabled) {
      sosService.removeUser(userId);
      setState((s) => ({ ...s, isActive: false }));
      return;
    }

    let lastUpdate = 0;
    let simulatedInterval: ReturnType<typeof setInterval> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let watchId: number | null = null;
    let gotRealPosition = false;

    /** Push a location update to the SOS service (throttled). */
    function pushUpdate(lat: number, lng: number, acc: number, simulated: boolean) {
      setState((s) => ({
        ...s,
        lat,
        lng,
        accuracy: acc,
        error: null,
        isActive: true,
        isSimulated: simulated,
      }));

      const now = Date.now();
      if (now - lastUpdate >= updateIntervalMs) {
        lastUpdate = now;
        const userLoc: UserLocation = {
          userId,
          lat,
          lng,
          phone: getUserPhone(),
          displayName: getUserName(),
          timestamp: now,
        };
        sosService.updateUserLocation(userLoc);
      }
    }

    /** Start simulated location updates every 5 seconds. */
    function startSimulated() {
      // Push one immediately
      pushUpdate(jitter(DEMO_LAT), jitter(DEMO_LNG), 15, true);
      simulatedInterval = setInterval(() => {
        pushUpdate(jitter(DEMO_LAT), jitter(DEMO_LNG), 15, true);
      }, 5000);
    }

    if (navigator.geolocation) {
      // Set a 4-second fallback — if no position comes through, go simulated
      fallbackTimer = setTimeout(() => {
        if (!gotRealPosition) {
          startSimulated();
        }
      }, 4000);

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          gotRealPosition = true;
          if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
          if (simulatedInterval) { clearInterval(simulatedInterval); simulatedInterval = null; }

          pushUpdate(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            false
          );
        },
        (_err) => {
          // Error → switch to simulated immediately
          if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
          if (!simulatedInterval) startSimulated();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 3000 }
      );
    } else {
      // No geolocation API — pure simulated
      startSimulated();
    }

    // Mark active
    setState((s) => ({ ...s, isActive: true }));

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (simulatedInterval) clearInterval(simulatedInterval);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
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
