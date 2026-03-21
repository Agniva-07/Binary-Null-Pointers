import { useEffect, useRef, useCallback } from "react";

interface UseFallDetectionOptions {
    onFallDetected: () => void;
    enabled: boolean;
}

/**
 * Detects a fall pattern:
 * 1. Freefall phase: total acceleration drops near 0 (< 3 m/s²) for > 200ms
 * 2. Impact phase: sudden spike in acceleration (> 25 m/s²)
 * 3. Stillness phase: low movement for > 2 seconds after impact
 */
export function useFallDetection({
    onFallDetected,
    enabled,
}: UseFallDetectionOptions) {
    const freefallStartRef = useRef<number | null>(null);
    const impactDetectedRef = useRef<number | null>(null);
    const cooldownRef = useRef<number>(0);
    const stillnessCountRef = useRef<number>(0);

    const handleMotion = useCallback(
        (event: DeviceMotionEvent) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            const x = acc.x ?? 0;
            const y = acc.y ?? 0;
            const z = acc.z ?? 0;

            // Total acceleration magnitude
            const magnitude = Math.sqrt(x * x + y * y + z * z);
            const now = Date.now();

            // Cooldown: prevent re-triggering for 10 seconds after a detection
            if (now - cooldownRef.current < 10000) return;

            // Phase 1: Freefall detection (acceleration near 0, i.e. < 3 m/s²)
            if (magnitude < 3) {
                if (!freefallStartRef.current) {
                    freefallStartRef.current = now;
                }
            } else {
                // Phase 2: Impact detection after freefall
                if (freefallStartRef.current) {
                    const freefallDuration = now - freefallStartRef.current;

                    // Need at least 150ms of freefall, then a big impact
                    if (freefallDuration > 150 && magnitude > 25) {
                        impactDetectedRef.current = now;
                        stillnessCountRef.current = 0;
                    }

                    // Reset freefall if we're back to normal acceleration
                    if (magnitude > 5) {
                        freefallStartRef.current = null;
                    }
                }

                // Phase 3: Stillness check after impact
                if (impactDetectedRef.current) {
                    const timeSinceImpact = now - impactDetectedRef.current;

                    // Check if relatively still (acceleration near gravity ~9.8)
                    if (magnitude > 7 && magnitude < 13) {
                        stillnessCountRef.current++;
                    } else {
                        stillnessCountRef.current = 0;
                    }

                    // If still for ~2 seconds after impact (20 readings at ~100ms intervals)
                    if (stillnessCountRef.current > 15 && timeSinceImpact > 2000) {
                        cooldownRef.current = now;
                        impactDetectedRef.current = null;
                        freefallStartRef.current = null;
                        stillnessCountRef.current = 0;
                        onFallDetected();
                    }

                    // Timeout: if 8 seconds pass without stillness, cancel
                    if (timeSinceImpact > 8000) {
                        impactDetectedRef.current = null;
                        stillnessCountRef.current = 0;
                    }
                }
            }
        },
        [onFallDetected]
    );

    useEffect(() => {
        if (!enabled) return;

        const requestPermission = async () => {
            if (
                typeof DeviceMotionEvent !== "undefined" &&
                typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
                    .requestPermission === "function"
            ) {
                try {
                    const permission = await (
                        DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
                    ).requestPermission();
                    if (permission === "granted") {
                        window.addEventListener("devicemotion", handleMotion);
                    }
                } catch {
                    window.addEventListener("devicemotion", handleMotion);
                }
            } else {
                window.addEventListener("devicemotion", handleMotion);
            }
        };

        requestPermission();

        return () => {
            window.removeEventListener("devicemotion", handleMotion);
        };
    }, [enabled, handleMotion]);
}
