import { useEffect, useRef, useCallback, useState } from "react";

interface UseShakeDetectionOptions {
  onShake: () => void;
  enabled: boolean;
  threshold?: number;
  requiredShakes?: number;
  windowMs?: number;
}

export type SensorStatus = "unavailable" | "pending" | "denied" | "active";

export function useShakeDetection({
  onShake,
  enabled,
  threshold = 12, // lowered from 18 for better sensitivity on mobile
  requiredShakes = 2,
  windowMs = 2000, // wider window
}: UseShakeDetectionOptions) {
  const shakesRef = useRef<number[]>([]);
  const lastTriggerRef = useRef<number>(0);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>("pending");
  const [lastAccel, setLastAccel] = useState<number>(0);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      // Calculate delta from gravity (~9.8 on z-axis when stationary)
      // Use acceleration if available, otherwise calculate from accelerationIncludingGravity
      let totalDelta: number;

      if (event.acceleration && event.acceleration.x !== null) {
        // Pure acceleration without gravity — best source
        const ax = event.acceleration.x ?? 0;
        const ay = event.acceleration.y ?? 0;
        const az = event.acceleration.z ?? 0;
        totalDelta = Math.sqrt(ax * ax + ay * ay + az * az);
      } else {
        // Fallback: use accelerationIncludingGravity
        // Subtract approximate gravity magnitude
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        totalDelta = Math.abs(magnitude - 9.81);
      }

      // Update last acceleration for debug display
      setLastAccel(Math.round(totalDelta * 10) / 10);

      // Mark sensor as active if we're getting data
      setSensorStatus("active");

      if (totalDelta > threshold) {
        const now = Date.now();
        shakesRef.current.push(now);

        // Filter old shakes outside our window
        shakesRef.current = shakesRef.current.filter(
          (t) => now - t < windowMs
        );

        if (shakesRef.current.length >= requiredShakes) {
          // Debounce: don't fire again within 3 seconds
          if (now - lastTriggerRef.current > 3000) {
            lastTriggerRef.current = now;
            shakesRef.current = [];
            onShake();
          }
        }
      }
    },
    [threshold, requiredShakes, windowMs, onShake]
  );

  useEffect(() => {
    if (!enabled) {
      setSensorStatus("pending");
      return;
    }

    // Check if DeviceMotionEvent is available
    if (typeof DeviceMotionEvent === "undefined") {
      setSensorStatus("unavailable");
      return;
    }
    let checkTimeout: ReturnType<typeof setTimeout> | null = null;

    const requestPermission = async () => {
      // iOS 13+ requires explicit permission
      if (
        typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
          .requestPermission === "function"
      ) {
        try {
          const permission = await (
            DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
          ).requestPermission();
          if (permission === "granted") {
            window.addEventListener("devicemotion", handleMotion);
            setSensorStatus("active");
          } else {
            setSensorStatus("denied");
          }
        } catch {
          // Try adding the listener anyway — some browsers don't implement requestPermission
          window.addEventListener("devicemotion", handleMotion);
          setSensorStatus("active");
        }
      } else {
        // Non-iOS — just add the listener
        window.addEventListener("devicemotion", handleMotion);
        setSensorStatus("active");
      }
    };

    requestPermission();

    return () => {
      if (checkTimeout) clearTimeout(checkTimeout);
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [enabled, handleMotion]);

  // Keyboard shortcut for desktop testing: press 'S' to simulate shake
  useEffect(() => {
    if (!enabled) return;

    let keyPresses: number[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

        const now = Date.now();
        keyPresses.push(now);
        keyPresses = keyPresses.filter((t) => now - t < 2000);

        if (keyPresses.length >= 3) {
          keyPresses = [];
          onShake();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onShake]);

  return { sensorStatus, lastAccel };
}
