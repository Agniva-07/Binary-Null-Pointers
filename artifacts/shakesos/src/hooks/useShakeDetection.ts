import { useEffect, useRef, useCallback } from "react";

interface UseShakeDetectionOptions {
  onShake: () => void;
  enabled: boolean;
  threshold?: number;
  requiredShakes?: number;
  windowMs?: number;
}

export function useShakeDetection({
  onShake,
  enabled,
  threshold = 18,
  requiredShakes = 2,
  windowMs = 1500,
}: UseShakeDetectionOptions) {
  const shakesRef = useRef<number[]>([]);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastShakeRef = useRef<number>(0);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      const deltaX = Math.abs(x - lastAccelRef.current.x);
      const deltaY = Math.abs(y - lastAccelRef.current.y);
      const deltaZ = Math.abs(z - lastAccelRef.current.z);

      lastAccelRef.current = { x, y, z };

      const totalDelta = deltaX + deltaY + deltaZ;

      if (totalDelta > threshold) {
        const now = Date.now();

        if (now - lastShakeRef.current < 200) return;
        lastShakeRef.current = now;

        shakesRef.current.push(now);
        shakesRef.current = shakesRef.current.filter(
          (t) => now - t < windowMs
        );

        if (shakesRef.current.length >= requiredShakes) {
          shakesRef.current = [];

          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            onShake();
          }, 100);
        }
      }
    },
    [onShake, threshold, requiredShakes, windowMs]
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, handleMotion]);
}
