/**
 * useSOSEscalation — 3-Stage Smart SOS Escalation System (DEMO MODE)
 *
 * Stage 0 (Idle): No SOS active.
 * Stage 1 (0–5s):  Initial SOS — alert contacts + nearby users (100m radius).
 * Stage 2 (5–15s): Auto-escalation — expand radius to 200m, siren + flash.
 * Stage 3 (15s+):  Extreme mode — call emergency services, repeat alerts every 15s.
 *
 * Response detection: any volunteer accepting stops escalation immediately.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { sosService, type NearbyUser } from "@/lib/sosService";

// ── Types ────────────────────────────────────────────────────────────────────

export type EscalationStage = 0 | 1 | 2 | 3;

export interface EscalationState {
  stage: EscalationStage;
  /** Seconds elapsed since SOS triggered */
  elapsed: number;
  /** Countdown seconds until next auto-escalation (null if stage 3) */
  countdown: number | null;
  /** Whether siren should be active */
  sirenActive: boolean;
  /** Whether screen flash should be active */
  flashActive: boolean;
  /** Whether continuous location tracking is active */
  trackingActive: boolean;
  /** Whether a responder has acknowledged */
  responded: boolean;
  /** Current radius in meters used for nearby user broadcasting */
  currentRadiusM: number;
  /** All nearby users alerted across all escalation rounds */
  alertedUsers: NearbyUser[];
  /** Number of times alerts have been repeated (stage 3) */
  repeatCount: number;
}

export interface EscalationActions {
  /** Start escalation when SOS is triggered */
  triggerSOS: (params: TriggerSOSParams) => void;
  /** Stop escalation (cancel / reset) */
  cancelEscalation: () => void;
  /** Mark that a responder acknowledged — stops escalation */
  handleResponse: () => void;
  /** Manually force escalation to next stage */
  forceEscalate: () => void;
}

export interface TriggerSOSParams {
  lat: number;
  lng: number;
  userId: string;
  phone: string;
  userName: string;
  /** Callback to play siren sound */
  onStartSiren: () => void;
  /** Callback to stop siren */
  onStopSiren: () => void;
  /** Callback called each location update interval (stage 2+) */
  onLocationUpdate?: (lat: number, lng: number) => void;
  /** Callback when extreme mode triggers (stage 3) */
  onEmergencyCall?: (number: string) => void;
  /** Callback when another nearby broadcast is sent */
  onNearbyAlert?: (users: NearbyUser[], stage: EscalationStage) => void;
}

// ── Constants (DEMO timings) ─────────────────────────────────────────────────

const STAGE1_RADIUS_M = 100;         // 100m initial radius (demo)
const STAGE2_RADIUS_M = 200;         // 200m escalated radius (demo)
const STAGE2_DELAY_MS = 5_000;       // 5 seconds → escalate to stage 2
const STAGE3_DELAY_MS = 15_000;      // 15 seconds → escalate to stage 3
const STAGE2_COUNTDOWN = 5;          // 5s countdown for stage 1
const STAGE3_COUNTDOWN = 10;         // 10s remaining after stage 2 start
const LOCATION_UPDATE_INTERVAL_MS = 3_000;  // every 3 seconds for demo
const REPEAT_ALERT_INTERVAL_MS = 10_000;    // repeat every 10s in stage 3
const EMERGENCY_NUMBER = "112";              // configurable emergency number

// Demo fallback location
const DEMO_LAT = 22.5726;
const DEMO_LNG = 88.3639;
function jitter(base: number, range = 0.0003): number {
  return base + (Math.random() - 0.5) * range;
}

// ── Initial State ─────────────────────────────────────────────────────────────

function makeIdleState(): EscalationState {
  return {
    stage: 0,
    elapsed: 0,
    countdown: null,
    sirenActive: false,
    flashActive: false,
    trackingActive: false,
    responded: false,
    currentRadiusM: STAGE1_RADIUS_M,
    alertedUsers: [],
    repeatCount: 0,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSOSEscalation(): EscalationState & EscalationActions {
  const [state, setState] = useState<EscalationState>(makeIdleState());

  // ── Refs for mutable state in timers ──────────────────────────────────────
  const paramsRef = useRef<TriggerSOSParams | null>(null);
  const startTimeRef = useRef<number>(0);
  const stageRef = useRef<EscalationStage>(0);
  const respondedRef = useRef(false);
  const sosIdRef = useRef<string | null>(null);
  const alertedUsersRef = useRef<NearbyUser[]>([]);

  // ── Timer refs ────────────────────────────────────────────────────────────
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stage2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage3TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup helper ────────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (tickIntervalRef.current) { clearInterval(tickIntervalRef.current); tickIntervalRef.current = null; }
    if (stage2TimerRef.current) { clearTimeout(stage2TimerRef.current); stage2TimerRef.current = null; }
    if (stage3TimerRef.current) { clearTimeout(stage3TimerRef.current); stage3TimerRef.current = null; }
    if (locationIntervalRef.current) { clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; }
    if (repeatIntervalRef.current) { clearInterval(repeatIntervalRef.current); repeatIntervalRef.current = null; }
  }, []);

  // ── Broadcast to nearby users at given radius ─────────────────────────────
  const broadcastNearby = useCallback(
    (radiusM: number, stage: EscalationStage) => {
      const p = paramsRef.current;
      if (!p) return;

      // Ensure we have a valid location — use demo fallback if needed
      const lat = p.lat || jitter(DEMO_LAT);
      const lng = p.lng || jitter(DEMO_LNG);

      const result = sosService.broadcastSOS(
        {
          userId: p.userId,
          lat,
          lng,
          phone: p.phone,
          timestamp: Date.now(),
        },
        radiusM
      );

      // Store sosId for the first broadcast
      if (!sosIdRef.current) {
        sosIdRef.current = result.sosId;
      }

      // Merge alerted users (avoid duplicates)
      const existingIds = new Set(alertedUsersRef.current.map((u) => u.userId));
      const newUsers = result.nearbyUsers.filter((u) => !existingIds.has(u.userId));
      alertedUsersRef.current = [...alertedUsersRef.current, ...newUsers];

      if (newUsers.length > 0) {
        sosService.simulateVolunteers(result.sosId, newUsers);
      }

      p.onNearbyAlert?.(result.nearbyUsers, stage);

      setState((prev) => ({
        ...prev,
        alertedUsers: [...alertedUsersRef.current],
        currentRadiusM: radiusM,
      }));
    },
    []
  );

  // ── WhatsApp alert (send to saved contact) ────────────────────────────────
  const sendWhatsAppAlert = useCallback(
    (lat: number, lng: number, userName: string, phone: string, stage: EscalationStage) => {
      if (!phone || phone === "+910000000000") return;
      const stageLabel = stage === 1 ? "⚠️ EMERGENCY" : stage === 2 ? "🚨 ESCALATED EMERGENCY" : "🆘 EXTREME EMERGENCY";
      const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      const message = encodeURIComponent(
        `${stageLabel} — SOS from ${userName}!\n\n` +
        `📍 Live location: ${mapsLink}\n` +
        `⏰ Time: ${new Date().toLocaleTimeString()}\n` +
        `📶 Alert Stage: ${stage}/3\n\n` +
        `Please respond immediately or call emergency services.\n` +
        `— Sent via ShakeSOS`
      );
      const cleanPhone = phone.replace(/[^+\d]/g, "");
      // Open in background tab to not disrupt the SOS screen
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    },
    []
  );

  // ── Get current location (with fallback) ──────────────────────────────────
  const getCurrentLocationForUpdate = useCallback(
    (callback: (lat: number, lng: number) => void) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            callback(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            // Failed — use jittered demo location
            callback(jitter(DEMO_LAT), jitter(DEMO_LNG));
          },
          { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
        );
      } else {
        callback(jitter(DEMO_LAT), jitter(DEMO_LNG));
      }
    },
    []
  );

  // ── Stage 2: escalation ───────────────────────────────────────────────────
  const escalateLevel1 = useCallback(() => {
    if (respondedRef.current || stageRef.current !== 1) return;

    stageRef.current = 2;
    const p = paramsRef.current;
    if (!p) return;

    // Activate siren + flash
    p.onStartSiren();

    // Vibrate SOS pattern (·· ··· ··)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 600, 300, 200, 100, 200, 100, 600]);
    }

    // Expand radius & broadcast more users
    broadcastNearby(STAGE2_RADIUS_M, 2);

    // Escalated WhatsApp
    sendWhatsAppAlert(p.lat || DEMO_LAT, p.lng || DEMO_LNG, p.userName, p.phone, 2);

    // Start location update interval
    locationIntervalRef.current = setInterval(() => {
      if (stageRef.current < 2 || respondedRef.current) return;
      getCurrentLocationForUpdate((lat, lng) => {
        if (paramsRef.current) {
          paramsRef.current.lat = lat;
          paramsRef.current.lng = lng;
        }
        p.onLocationUpdate?.(lat, lng);
      });
    }, LOCATION_UPDATE_INTERVAL_MS);

    setState((prev) => ({
      ...prev,
      stage: 2,
      sirenActive: true,
      flashActive: true,
      trackingActive: true,
      countdown: STAGE3_COUNTDOWN,
      currentRadiusM: STAGE2_RADIUS_M,
    }));
  }, [broadcastNearby, sendWhatsAppAlert, getCurrentLocationForUpdate]);

  // ── Stage 3: extreme mode ─────────────────────────────────────────────────
  const escalateLevel2 = useCallback(() => {
    if (respondedRef.current || stageRef.current !== 2) return;

    stageRef.current = 3;
    const p = paramsRef.current;
    if (!p) return;

    // Trigger emergency call
    p.onEmergencyCall?.(EMERGENCY_NUMBER);

    // Extreme WhatsApp
    sendWhatsAppAlert(p.lat || DEMO_LAT, p.lng || DEMO_LNG, p.userName, p.phone, 3);

    // Vibrate continuous distress
    if (navigator.vibrate) {
      navigator.vibrate([500, 100, 500, 100, 500, 100, 1000]);
    }

    // Repeat alerts every 10s (demo)
    let repeats = 0;
    repeatIntervalRef.current = setInterval(() => {
      if (respondedRef.current || stageRef.current < 3) return;
      repeats++;
      // Re-broadcast nearby
      if (paramsRef.current) {
        broadcastNearby(STAGE2_RADIUS_M, 3);
      }
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
      }
      setState((prev) => ({ ...prev, repeatCount: repeats }));
    }, REPEAT_ALERT_INTERVAL_MS);

    setState((prev) => ({
      ...prev,
      stage: 3,
      countdown: null,
      sirenActive: true,
      flashActive: true,
    }));
  }, [broadcastNearby, sendWhatsAppAlert]);

  // ── Main tick ─────────────────────────────────────────────────────────────
  const startTick = useCallback(() => {
    tickIntervalRef.current = setInterval(() => {
      if (respondedRef.current) return;

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const stage = stageRef.current;

      let countdown: number | null = null;
      if (stage === 1) countdown = Math.max(0, STAGE2_COUNTDOWN - elapsed);
      else if (stage === 2) countdown = Math.max(0, Math.floor(STAGE3_DELAY_MS / 1000) - elapsed);
      else countdown = null;

      setState((prev) => ({ ...prev, elapsed, countdown }));
    }, 1000);
  }, []);

  // ── triggerSOS (public) ───────────────────────────────────────────────────
  const triggerSOS = useCallback(
    (params: TriggerSOSParams) => {
      // Guard: prevent double-trigger
      if (stageRef.current !== 0) return;

      // Ensure we have a valid location — use demo fallback if needed
      if (!params.lat || !params.lng) {
        params.lat = jitter(DEMO_LAT);
        params.lng = jitter(DEMO_LNG);
      }

      paramsRef.current = params;
      startTimeRef.current = Date.now();
      stageRef.current = 1;
      respondedRef.current = false;
      alertedUsersRef.current = [];
      sosIdRef.current = null;

      // Initialize mock users around our location
      sosService.initMockUsers(params.lat, params.lng);

      // Initial broadcast (100m)
      broadcastNearby(STAGE1_RADIUS_M, 1);

      // Send WhatsApp to contact immediately
      sendWhatsAppAlert(params.lat, params.lng, params.userName, params.phone, 1);

      // Vibrate
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      setState({
        stage: 1,
        elapsed: 0,
        countdown: STAGE2_COUNTDOWN,
        sirenActive: false,
        flashActive: false,
        trackingActive: false,
        responded: false,
        currentRadiusM: STAGE1_RADIUS_M,
        alertedUsers: [],
        repeatCount: 0,
      });

      startTick();

      // Schedule stage 2 after 5s
      stage2TimerRef.current = setTimeout(() => {
        escalateLevel1();
      }, STAGE2_DELAY_MS);

      // Schedule stage 3 after 15s
      stage3TimerRef.current = setTimeout(() => {
        escalateLevel2();
      }, STAGE3_DELAY_MS);
    },
    [broadcastNearby, sendWhatsAppAlert, startTick, escalateLevel1, escalateLevel2]
  );

  // ── cancelEscalation (public) ─────────────────────────────────────────────
  const cancelEscalation = useCallback(() => {
    clearAllTimers();
    const p = paramsRef.current;
    if (p) p.onStopSiren();

    if (sosIdRef.current) {
      sosService.cancelSOS(sosIdRef.current);
    }

    stageRef.current = 0;
    respondedRef.current = false;
    paramsRef.current = null;
    alertedUsersRef.current = [];
    sosIdRef.current = null;
    setState(makeIdleState());
  }, [clearAllTimers]);

  // ── handleResponse (public) ───────────────────────────────────────────────
  const handleResponse = useCallback(() => {
    if (respondedRef.current) return;
    respondedRef.current = true;

    clearAllTimers();
    const p = paramsRef.current;
    if (p) p.onStopSiren();

    stageRef.current = 0;

    setState((prev) => ({
      ...prev,
      stage: 0,
      responded: true,
      sirenActive: false,
      flashActive: false,
      trackingActive: false,
      countdown: null,
    }));
  }, [clearAllTimers]);

  // ── forceEscalate (public) ────────────────────────────────────────────────
  const forceEscalate = useCallback(() => {
    const stage = stageRef.current;
    if (stage === 1) {
      // Clear the pending stage2 timer and fire immediately
      if (stage2TimerRef.current) { clearTimeout(stage2TimerRef.current); stage2TimerRef.current = null; }
      escalateLevel1();
    } else if (stage === 2) {
      if (stage3TimerRef.current) { clearTimeout(stage3TimerRef.current); stage3TimerRef.current = null; }
      escalateLevel2();
    }
  }, [escalateLevel1, escalateLevel2]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    ...state,
    triggerSOS,
    cancelEscalation,
    handleResponse,
    forceEscalate,
  };
}
