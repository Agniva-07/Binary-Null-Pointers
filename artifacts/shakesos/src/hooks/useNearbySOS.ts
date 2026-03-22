/**
 * useNearbySOS — manages SOS broadcast, volunteer tracking, and incoming SOS alerts.
 *
 * For the VICTIM: broadcast SOS, track incoming volunteers.
 * For HELPERS: receive nearby SOS alerts, accept/ignore.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  sosService,
  type SOSData,
  type NearbyUser,
  type VolunteerInfo,
  haversineDistance,
} from "@/lib/sosService";

// ── Victim Hook ─────────────────────────────────────────────────────────────

interface BroadcastResult {
  sosId: string;
  nearbyUsers: NearbyUser[];
}

interface UseSOSBroadcastReturn {
  /** Broadcast an SOS from the victim's location. */
  broadcastSOS: (data: {
    lat: number;
    lng: number;
    phone: string;
    userId: string;
  }) => BroadcastResult | null;
  /** Current active SOS ID. */
  activeSosId: string | null;
  /** List of nearby users found. */
  nearbyUsers: NearbyUser[];
  /** Volunteers who have accepted to help. */
  volunteers: VolunteerInfo[];
  /** Cancel the current SOS. */
  cancelSOS: () => void;
  /** Whether SOS has been broadcast. */
  isBroadcast: boolean;
}

export function useSOSBroadcast(): UseSOSBroadcastReturn {
  const [activeSosId, setActiveSosId] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerInfo[]>([]);
  const [isBroadcast, setIsBroadcast] = useState(false);

  // Poll volunteers when SOS is active
  useEffect(() => {
    if (!activeSosId) return;

    // Subscribe to change events
    const unsub = sosService.onSOSChange(activeSosId, () => {
      setVolunteers([...sosService.getVolunteers(activeSosId)]);
    });

    // Also poll every 2s as a fallback
    const interval = setInterval(() => {
      setVolunteers([...sosService.getVolunteers(activeSosId)]);
    }, 2000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [activeSosId]);

  const broadcastSOS = useCallback(
    (data: { lat: number; lng: number; phone: string; userId: string }) => {
      const result = sosService.broadcastSOS({
        userId: data.userId,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        timestamp: Date.now(),
      });

      setActiveSosId(result.sosId);
      setNearbyUsers(result.nearbyUsers);
      setIsBroadcast(true);

      // Auto-simulate volunteers accepting (for demo)
      if (result.nearbyUsers.length > 0) {
        sosService.simulateVolunteers(result.sosId, result.nearbyUsers);
      }

      // Vibrate pattern for alert
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      return result;
    },
    []
  );

  const cancelSOS = useCallback(() => {
    if (activeSosId) {
      sosService.cancelSOS(activeSosId);
    }
    setActiveSosId(null);
    setNearbyUsers([]);
    setVolunteers([]);
    setIsBroadcast(false);
  }, [activeSosId]);

  return {
    broadcastSOS,
    activeSosId,
    nearbyUsers,
    volunteers,
    cancelSOS,
    isBroadcast,
  };
}

// ── Helper Hook ─────────────────────────────────────────────────────────────

interface IncomingSOS {
  sosData: SOSData;
  distanceFromMe: number;
  dismissed: boolean;
  accepted: boolean;
}

interface UseNearbySosAlertReturn {
  /** Incoming SOS alerts for this user. */
  incomingAlerts: IncomingSOS[];
  /** Accept an SOS — volunteer to help. */
  acceptSOS: (sosId: string) => void;
  /** Dismiss/ignore an alert. */
  dismissSOS: (sosId: string) => void;
  /** The latest active (non-dismissed) alert. */
  activeAlert: IncomingSOS | null;
}

export function useNearbySosAlert(
  userId: string,
  myLat: number | null,
  myLng: number | null
): UseNearbySosAlertReturn {
  const [incomingAlerts, setIncomingAlerts] = useState<IncomingSOS[]>([]);
  const alertsRef = useRef<IncomingSOS[]>([]);

  // Subscribe to SOS broadcasts
  useEffect(() => {
    if (!userId) return;

    const unsub = sosService.onSOSReceived(userId, (sos: SOSData) => {
      const dist =
        myLat !== null && myLng !== null
          ? Math.round(haversineDistance(myLat, myLng, sos.lat, sos.lng))
          : 0;

      const newAlert: IncomingSOS = {
        sosData: sos,
        distanceFromMe: dist,
        dismissed: false,
        accepted: false,
      };

      alertsRef.current = [...alertsRef.current, newAlert];
      setIncomingAlerts([...alertsRef.current]);

      // Vibrate + play sound for incoming alert
      if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 600]);
      }
    });

    return unsub;
  }, [userId, myLat, myLng]);

  const acceptSOS = useCallback(
    (sosId: string) => {
      alertsRef.current = alertsRef.current.map((a) =>
        a.sosData.id === sosId ? { ...a, accepted: true } : a
      );
      setIncomingAlerts([...alertsRef.current]);

      // Register as volunteer
      const alert = alertsRef.current.find((a) => a.sosData.id === sosId);
      if (alert && myLat !== null && myLng !== null) {
        sosService.acceptHelp(sosId, {
          helperId: userId,
          phone:
            localStorage.getItem("shakesos-contact") || "+910000000000",
          displayName:
            localStorage.getItem("shakesos-contact-name") || "Helper",
          distance: alert.distanceFromMe,
          lat: myLat,
          lng: myLng,
        });
      }
    },
    [userId, myLat, myLng]
  );

  const dismissSOS = useCallback((sosId: string) => {
    alertsRef.current = alertsRef.current.map((a) =>
      a.sosData.id === sosId ? { ...a, dismissed: true } : a
    );
    setIncomingAlerts([...alertsRef.current]);
  }, []);

  const activeAlert =
    incomingAlerts.find((a) => !a.dismissed && !a.accepted) || null;

  return { incomingAlerts, acceptSOS, dismissSOS, activeAlert };
}
