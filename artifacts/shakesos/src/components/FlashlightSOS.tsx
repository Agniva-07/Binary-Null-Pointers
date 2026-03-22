import { useState, useEffect, useRef, useCallback } from "react";

interface FlashlightSOSProps {
  onClose: () => void;
}

/**
 * SOS Morse Code: ··· ─── ···
 * Dot = short flash (200ms on, 200ms off)
 * Dash = long flash (600ms on, 200ms off)
 * Letter gap = 600ms off
 * Word gap = 1400ms off  
 */

const DOT = 200;
const DASH = 600;
const ELEMENT_GAP = 200;
const LETTER_GAP = 600;
const WORD_GAP = 1400;

// SOS pattern: S=··· O=─── S=···
const SOS_PATTERN = [
  // S
  DOT, ELEMENT_GAP, DOT, ELEMENT_GAP, DOT,
  LETTER_GAP,
  // O
  DASH, ELEMENT_GAP, DASH, ELEMENT_GAP, DASH,
  LETTER_GAP,
  // S
  DOT, ELEMENT_GAP, DOT, ELEMENT_GAP, DOT,
  WORD_GAP,
];

export default function FlashlightSOS({ onClose }: FlashlightSOSProps) {
  const [isActive, setIsActive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [patternIndex, setPatternIndex] = useState(0);
  const [screenFlash, setScreenFlash] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState<boolean | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnRef = useRef(false);

  // Try to access torch
  useEffect(() => {
    const checkTorch = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
        if (caps.torch) {
          trackRef.current = track;
          setTorchAvailable(true);
        } else {
          track.stop();
          setTorchAvailable(false);
        }
      } catch {
        setTorchAvailable(false);
      }
    };
    checkTorch();

    return () => {
      if (trackRef.current) {
        trackRef.current.stop();
      }
    };
  }, []);

  // Control torch
  const setTorch = useCallback(async (on: boolean) => {
    if (trackRef.current) {
      try {
        await trackRef.current.applyConstraints({
          advanced: [{ torch: on } as MediaTrackConstraintSet & { torch: boolean }],
        } as MediaTrackConstraints);
      } catch { }
    }
    setFlashOn(on);
    setScreenFlash(on);
  }, []);

  // Run SOS pattern
  useEffect(() => {
    if (!isActive) return;

    let idx = 0;
    isOnRef.current = false;

    const step = () => {
      if (!isActive) return;

      const isFlash = idx % 2 === 0; // even indices = flash durations, odd = gaps
      const flashIndex = Math.floor(idx / 2);

      if (flashIndex >= SOS_PATTERN.length) {
        // Restart pattern
        idx = 0;
        step();
        return;
      }

      const duration = SOS_PATTERN[flashIndex];

      if (isFlash) {
        // Turn on
        isOnRef.current = true;
        setTorch(true);
        timeoutRef.current = setTimeout(() => {
          // Turn off
          isOnRef.current = false;
          setTorch(false);
          idx++;
          timeoutRef.current = setTimeout(step, 0);
        }, duration);
      } else {
        // Gap (already off)
        timeoutRef.current = setTimeout(() => {
          idx++;
          step();
        }, duration);
      }
    };

    step();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTorch(false);
    };
  }, [isActive, setTorch]);

  const handleStart = () => setIsActive(true);

  const handleStop = () => {
    setIsActive(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTorch(false);
    setPatternIndex(0);
  };

  const handleClose = () => {
    handleStop();
    if (trackRef.current) {
      trackRef.current.stop();
      trackRef.current = null;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-100"
      style={{
        backgroundColor: screenFlash ? "#ffffff" : "#0a0a0a",
      }}
    >
      <div className="text-center px-6">
        {/* Icon */}
        <div className="relative mb-6">
          <div
            className={`h-32 w-32 mx-auto rounded-full flex items-center justify-center transition-all duration-100 ${
              flashOn
                ? "bg-yellow-400 shadow-[0_0_60px_20px_rgba(250,204,21,0.5)]"
                : "bg-gray-800 border-2 border-gray-700"
            }`}
          >
            <span className="text-5xl">{flashOn ? "💡" : "🔦"}</span>
          </div>
          {isActive && (
            <>
              <div className="absolute inset-0 rounded-full bg-yellow-400/20 pulse-ring mx-auto" style={{ width: 128, height: 128 }} />
            </>
          )}
        </div>

        <h1
          className="text-4xl font-black mb-2 transition-colors duration-100"
          style={{ color: screenFlash ? "#0a0a0a" : "#ffffff" }}
        >
          {isActive ? "SOS ··· ─── ···" : "Flashlight SOS"}
        </h1>

        <p
          className="text-sm mb-2 transition-colors duration-100"
          style={{ color: screenFlash ? "#444" : "#9ca3af" }}
        >
          {isActive
            ? "Morse code SOS pattern: ··· ─── ··· (dot-dot-dot dash-dash-dash dot-dot-dot)"
            : "Flash your torch in SOS morse code pattern"}
        </p>

        {torchAvailable === false && (
          <p
            className="text-xs mb-4 py-2 px-3 rounded-lg inline-block transition-colors duration-100"
            style={{
              color: screenFlash ? "#92400e" : "#fbbf24",
              background: screenFlash ? "rgba(146,64,14,0.1)" : "rgba(251,191,36,0.1)",
            }}
          >
            ⚠️ Camera torch not available — using screen flash instead
          </p>
        )}

        {/* SOS Pattern Visualization */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {/* S: ··· */}
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="w-3" />
          {/* O: ─── */}
          <span className="h-2 w-6 rounded-full bg-red-500" />
          <span className="h-2 w-6 rounded-full bg-red-500" />
          <span className="h-2 w-6 rounded-full bg-red-500" />
          <span className="w-3" />
          {/* S: ··· */}
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="w-64 rounded-2xl bg-yellow-500 py-4 text-lg font-black text-black transition-all active:scale-95"
              style={{ boxShadow: "0 4px 24px rgba(234,179,8,0.4)" }}
            >
              🔦 Start SOS Flash
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-64 rounded-2xl py-4 text-lg font-black transition-all active:scale-95"
              style={{
                backgroundColor: screenFlash ? "#dc2626" : "#ffffff",
                color: screenFlash ? "#ffffff" : "#dc2626",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              ■ Stop Flashing
            </button>
          )}

          <button
            onClick={handleClose}
            className="w-64 rounded-2xl border py-3 text-sm font-semibold transition-all active:scale-95"
            style={{
              borderColor: screenFlash ? "#d1d5db" : "#374151",
              color: screenFlash ? "#374151" : "#9ca3af",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
