/**
 * NearbySOSAlert — Full-screen overlay shown when a nearby SOS is received.
 *
 * Shows victim info, distance, phone number, and accept/ignore buttons.
 * After accepting, shows confirmation with "heading to help" status.
 */

import { useState, useEffect } from "react";
import type { SOSData } from "@/lib/sosService";

interface NearbySOSAlertProps {
  sosData: SOSData;
  distanceFromMe: number;
  onAccept: (sosId: string) => void;
  onDismiss: (sosId: string) => void;
}

export default function NearbySOSAlert({
  sosData,
  distanceFromMe,
  onAccept,
  onDismiss,
}: NearbySOSAlertProps) {
  const [accepted, setAccepted] = useState(false);
  const [pulseClass, setPulseClass] = useState(true);

  // Alert pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseClass((p) => !p);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = () => {
    setAccepted(true);
    onAccept(sosData.id);
    // Vibrate confirmation
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const mapsLink = `https://www.google.com/maps?q=${sosData.lat},${sosData.lng}`;
  const timeString = new Date(sosData.timestamp).toLocaleTimeString();

  if (accepted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md px-4">
        <div className="w-full max-w-sm fade-in">
          {/* Success Animation */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl">
                <span className="text-5xl">✓</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 pulse-ring" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              You're Heading to Help!
            </h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Thank you for volunteering. The person in need has been notified.
            </p>
          </div>

          {/* Route Info Card */}
          <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                Navigation
              </span>
              <span className="text-xs text-emerald-400/70 font-mono">
                ~{distanceFromMe}m away
              </span>
            </div>
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-emerald-600/20 border border-emerald-700/30 px-4 py-3 transition-all active:scale-95"
            >
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-300">
                  Open in Google Maps
                </p>
                <p className="text-xs text-emerald-500/70">
                  Get directions to the victim
                </p>
              </div>
              <span className="text-emerald-400">→</span>
            </a>
          </div>

          {/* Phone Contact */}
          <a
            href={`tel:${sosData.phone}`}
            className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/50 p-4 mb-4 transition-all active:scale-95"
          >
            <span className="text-2xl">📞</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Call the person</p>
              <p className="text-xs text-gray-500">{sosData.phone}</p>
            </div>
          </a>

          {/* Status */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/20 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">
                Status: On the way
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md px-4">
      <div className="w-full max-w-sm fade-in">
        {/* Alert Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div
              className={`h-28 w-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                pulseClass
                  ? "bg-gradient-to-br from-red-500 to-red-700"
                  : "bg-gradient-to-br from-red-600 to-red-800"
              }`}
              style={{
                boxShadow: pulseClass
                  ? "0 0 60px rgba(220,38,38,0.6)"
                  : "0 0 30px rgba(220,38,38,0.3)",
              }}
            >
              <span className="text-5xl">🆘</span>
            </div>
            <div className="absolute inset-0 rounded-full bg-red-500/20 pulse-ring" />
          </div>

          <h2 className="text-2xl font-black text-white mb-1">
            Someone Needs Help!
          </h2>
          <p className="text-sm text-red-400 font-medium">
            Emergency SOS nearby
          </p>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-red-800/50 bg-red-950/20 p-4 mb-4 space-y-3">
          {/* Distance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📏</span>
              <span className="text-sm text-gray-300">Distance</span>
            </div>
            <span className="text-sm font-bold text-red-400 font-mono">
              ~{distanceFromMe}m
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <span className="text-sm text-gray-300">Time</span>
            </div>
            <span className="text-sm font-medium text-gray-400">
              {timeString}
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📱</span>
              <span className="text-sm text-gray-300">Phone</span>
            </div>
            <a
              href={`tel:${sosData.phone}`}
              className="text-sm font-medium text-blue-400 underline"
            >
              {sosData.phone}
            </a>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-sm text-gray-300">Location</span>
            </div>
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-400 underline"
            >
              Open Maps →
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAccept}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-4 text-base font-black text-white transition-all active:scale-95"
            style={{ boxShadow: "0 4px 24px rgba(16,185,129,0.4)" }}
          >
            ✅ Accept — I'll Help
          </button>

          <button
            onClick={() => onDismiss(sosData.id)}
            className="w-full rounded-2xl border border-gray-700 bg-gray-800/80 py-3.5 text-sm font-semibold text-gray-400 transition-all active:scale-95 active:bg-gray-700"
          >
            Ignore
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-gray-600 mt-4">
          Only accept if you're able to safely help
        </p>
      </div>
    </div>
  );
}
