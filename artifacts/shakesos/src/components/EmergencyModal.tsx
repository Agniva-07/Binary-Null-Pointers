import { useState, useEffect, useCallback } from "react";
import { useAlarm } from "@/hooks/useAlarm";

interface EmergencyModalProps {
  onOK: () => void;
  onHelp: () => void;
  onAutoTrigger: () => void;
  countdownSeconds?: number;
}

export default function EmergencyModal({
  onOK,
  onHelp,
  onAutoTrigger,
  countdownSeconds = 15,
}: EmergencyModalProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const { startAlarm, stopAlarm } = useAlarm();

  useEffect(() => {
    startAlarm();
    return () => stopAlarm();
  }, [startAlarm, stopAlarm]);

  useEffect(() => {
    if (countdown <= 0) {
      stopAlarm();
      onAutoTrigger();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onAutoTrigger, stopAlarm]);

  const handleOK = useCallback(() => {
    stopAlarm();
    onOK();
  }, [stopAlarm, onOK]);

  const handleHelp = useCallback(() => {
    stopAlarm();
    onHelp();
  }, [stopAlarm, onHelp]);

  const progress = (countdown / countdownSeconds) * 100;
  const isUrgent = countdown <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 alarm-flash">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ backdropFilter: "blur(4px)" }}
      />
      <div className="relative w-full max-w-sm fade-in">
        <div
          className="rounded-2xl border border-red-500/30 bg-[#0f0f0f] p-6 shadow-2xl"
          style={{ boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}
        >
          <div className="mb-6 text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-red-600/20 pulse-ring" />
                <div className="absolute inset-0 rounded-full bg-red-600/20 pulse-ring" style={{ animationDelay: "0.5s" }} />
                <span className="relative text-4xl">⚠️</span>
              </div>
            </div>

            <h2 className="mb-2 text-xl font-bold text-white">
              Possible Emergency Detected
            </h2>
            <p className="text-sm text-gray-400">Are you OK?</p>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Auto-sending SOS in</span>
              <span
                className={`text-2xl font-black countdown-tick ${isUrgent ? "text-red-500" : "text-white"}`}
                key={countdown}
              >
                {countdown}s
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  backgroundColor: isUrgent ? "#ef4444" : "#dc2626",
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleHelp}
              className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold text-white transition-all active:scale-95 active:bg-red-700"
              style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.5)" }}
            >
              🆘 Help Me — Send SOS Now
            </button>
            <button
              onClick={handleOK}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 py-4 text-lg font-semibold text-white transition-all active:scale-95 active:bg-gray-700"
            >
              ✅ I'm OK — Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
