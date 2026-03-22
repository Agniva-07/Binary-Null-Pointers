import { useState, useEffect, useCallback, useRef } from "react";

interface LiveLocationSharingProps {
  onBack: () => void;
}

export default function LiveLocationSharing({ onBack }: LiveLocationSharingProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState(30); // minutes
  const [timeLeft, setTimeLeft] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [updates, setUpdates] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSharing = useCallback(() => {
    if (!navigator.geolocation) return;

    // Start watching location
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(newLoc);
        setUpdates((u) => u + 1);

        // Generate a sharable link with current location
        const link = `https://www.google.com/maps?q=${newLoc.lat},${newLoc.lng}`;
        setShareLink(link);
      },
      (err) => {
        console.error("Location error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    setTimeLeft(duration * 60);
    setIsSharing(true);

    // Countdown
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopSharing();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [duration]);

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSharing(false);
    setTimeLeft(0);
    setUpdates(0);
  }, []);

  useEffect(() => {
    return () => {
      stopSharing();
    };
  }, [stopSharing]);

  const handleCopy = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareLink]);

  const handleShare = useCallback(() => {
    if (!shareLink) return;
    const message = `📍 Track my live location:\n${shareLink}\n\n⏰ Sharing for ${duration} minutes\n— Sent via ShakeSOS`;
    if (navigator.share) {
      navigator.share({ title: "My Live Location", text: message }).catch(() => { });
    } else {
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
  }, [shareLink, duration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isSharing) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-5 py-8 pb-24">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={stopSharing}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3.5 py-2 text-sm font-medium text-gray-300"
            >
              ■ Stop
            </button>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-400">Sharing Live</span>
            </div>
          </div>

          {/* Status */}
          <div
            className="mb-4 rounded-2xl border border-green-500/30 bg-green-950/20 p-4"
            style={{ boxShadow: "0 0 20px rgba(34,197,94,0.15)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📡</span>
              <div>
                <p className="text-sm font-bold text-green-400">Location Broadcasting</p>
                <p className="text-xs text-green-300/60">
                  {updates} updates sent · {formatTime(timeLeft)} remaining
                </p>
              </div>
            </div>

            {location && (
              <div className="rounded-xl bg-green-900/30 p-3 mb-3">
                <p className="text-xs text-gray-400 font-mono">
                  📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              </div>
            )}

            {/* Timer Ring */}
            <div className="flex justify-center mb-3">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#1f2937" strokeWidth="4" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={timeLeft < 60 ? "#ef4444" : "#22c55e"}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - timeLeft / (duration * 60))}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Share Actions */}
          <div className="space-y-3">
            <button
              onClick={handleShare}
              className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-all active:scale-95"
            >
              📤 Share Location Link
            </button>
            <button
              onClick={handleCopy}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 py-3.5 text-sm font-bold text-white transition-all active:scale-95"
            >
              {copied ? "✅ Copied!" : "📋 Copy Link"}
            </button>
            {shareLink && (
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl border border-blue-700/40 bg-blue-950/20 py-3 text-center text-sm font-medium text-blue-400"
              >
                🗺️ Open in Maps
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 py-8 pb-24">
      <div className="w-full max-w-sm mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">📍 Live Location</h1>
          <p className="text-sm text-gray-400">
            Share your real-time location with anyone via a link. Perfect for letting someone track your journey home.
          </p>
        </div>

        <div className="space-y-5">
          {/* Duration */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Share for how long?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 60, 120].map((m) => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  className={`rounded-lg py-2.5 text-sm font-medium transition-all ${
                    duration === m
                      ? "bg-green-600 text-white"
                      : "border border-gray-700 bg-gray-800 text-gray-400"
                  }`}
                >
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">How it works</p>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• Your GPS location updates continuously</li>
              <li>• Share the link via any messaging app</li>
              <li>• Anyone with the link can view your location on Google Maps</li>
              <li>• Sharing automatically stops after the timer expires</li>
            </ul>
          </div>

          {/* Start */}
          <button
            onClick={startSharing}
            className="w-full rounded-xl bg-green-600 py-4 text-base font-bold text-white transition-all active:scale-95"
            style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
          >
            📡 Start Sharing Location
          </button>
        </div>
      </div>
    </div>
  );
}
