import { useState, useEffect, useCallback } from "react";
import { LocationData } from "@/hooks/useGeolocation";
import { useGeolocation } from "@/hooks/useGeolocation";
import LocationDisplay from "@/components/LocationDisplay";
import VolunteerTracker from "@/components/VolunteerTracker";

import type { SensorStatus } from "@/hooks/useShakeDetection";
import type { NearbyUser, VolunteerInfo } from "@/lib/sosService";

interface SOSScreenProps {
  isMonitoring: boolean;
  sosTriggered: boolean;
  location: LocationData | null;
  onManualSOS: () => void;
  onResetSOS: () => void;
  onStop: () => void;
  onContact: () => void;
  isRecording?: boolean;
  onSiren?: () => void;
  sensorStatus?: SensorStatus;
  lastAccel?: number;
  // Community SOS props
  isBroadcast?: boolean;
  nearbyUsers?: NearbyUser[];
  volunteers?: VolunteerInfo[];
}

export default function SOSScreen({
  isMonitoring,
  sosTriggered,
  location,
  onManualSOS,
  onResetSOS,
  onStop,
  onContact,
  isRecording = false,
  onSiren,
  sensorStatus = "pending",
  lastAccel = 0,
  isBroadcast = false,
  nearbyUsers = [],
  volunteers = [],
}: SOSScreenProps) {
  const [shakeCount, setShakeCount] = useState(0);
  const [pressing, setPressing] = useState(false);
  const contact = localStorage.getItem("shakesos-contact") || "";
  const contactName = localStorage.getItem("shakesos-contact-name") || contact;
  const { getGoogleMapsLink } = useGeolocation();

  const buildWhatsAppMessage = useCallback(() => {
    let locationText = "Location unavailable";
    let mapsLink = "";
    if (location && location.lat !== 0) {
      mapsLink = getGoogleMapsLink(location);
      locationText = mapsLink;
    }
    const message =
      `🆘 SOS EMERGENCY ALERT!\n\n` +
      `I need immediate help! Please contact emergency services or come to my location now!\n\n` +
      `📍 My location: ${locationText}\n\n` +
      `⏰ Sent at: ${new Date().toLocaleTimeString()}\n\n` +
      `— Sent automatically via ShakeSOS`;
    return encodeURIComponent(message);
  }, [location, getGoogleMapsLink]);

  const sendWhatsApp = useCallback(() => {
    if (!contact) {
      onContact();
      return;
    }
    const cleanPhone = contact.replace(/[^+\d]/g, "");
    const msg = buildWhatsAppMessage();
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  }, [contact, buildWhatsAppMessage, onContact]);

  useEffect(() => {
    if (sosTriggered) {
      sendWhatsApp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sosTriggered]);

  useEffect(() => {
    if (!isMonitoring) {
      setShakeCount(0);
    }
  }, [isMonitoring]);

  const simulateShake = () => {
    setShakeCount((c) => c + 1);
    setTimeout(() => setShakeCount(0), 3000);
  };

  return (
    <div
      className={`flex min-h-screen flex-col bg-background px-5 py-8 transition-colors duration-500 ${sosTriggered ? "active-monitoring" : ""
        }`}
    >
      <div className="w-full max-w-sm mx-auto flex flex-col h-full min-h-screen justify-between">
        <div>
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3.5 py-2 text-sm font-medium text-gray-300 transition-all active:bg-gray-700"
            >
              ← Stop
            </button>

            <div className="flex items-center gap-2">
              {isRecording && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  REC
                </span>
              )}
              <div
                className={`h-2 w-2 rounded-full ${isMonitoring ? "bg-green-500 animate-pulse" : "bg-gray-600"
                  }`}
              />
              <span className="text-sm font-medium text-gray-400">
                {isMonitoring ? "Monitoring" : "Inactive"}
              </span>
            </div>

            <button
              onClick={onContact}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3 py-2 text-sm font-medium text-gray-300 transition-all active:bg-gray-700"
            >
              👤
            </button>
          </div>

          {sosTriggered && (
            <div
              className="mb-4 rounded-2xl border border-red-500/40 bg-red-950/30 p-4 alarm-flash fade-in"
              style={{ boxShadow: "0 0 30px rgba(220,38,38,0.3)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🆘</span>
                <div>
                  <p className="font-bold text-red-400">SOS TRIGGERED</p>
                  <p className="text-xs text-red-300/70">Emergency message sent via WhatsApp</p>
                  {isRecording && (
                    <p className="text-xs text-orange-400 mt-0.5">🎤 Audio recording active</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Community SOS Broadcast Status */}
          {sosTriggered && isBroadcast && (
            <div
              className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4 fade-in"
              style={{ boxShadow: "0 0 20px rgba(59,130,246,0.15)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📡</span>
                <div>
                  <p className="text-sm font-bold text-blue-400">
                    Community Alert Sent
                  </p>
                  <p className="text-xs text-blue-300/60">
                    {nearbyUsers.length} users notified within 50m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Volunteer Tracker */}
          {sosTriggered && isBroadcast && (
            <div className="mb-5">
              <VolunteerTracker
                volunteers={volunteers}
                nearbyCount={nearbyUsers.length}
              />
            </div>
          )}

          <div className="mb-5">
            <LocationDisplay location={location} />
          </div>

          {contact ? (
            <div className="mb-5 rounded-xl border border-gray-800 bg-gray-900/50 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="text-xs text-gray-500">Emergency contact</p>
                    <p className="text-sm font-medium text-white">{contactName}</p>
                  </div>
                </div>
                <button
                  onClick={sendWhatsApp}
                  className="rounded-lg bg-green-700/30 border border-green-700/40 px-3 py-1.5 text-xs font-medium text-green-400"
                >
                  Test →
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onContact}
              className="mb-5 w-full rounded-xl border border-yellow-800/40 bg-yellow-950/20 p-3.5 text-left"
            >
              <p className="text-sm font-medium text-yellow-400">⚠️ No emergency contact</p>
              <p className="text-xs text-yellow-600 mt-0.5">Tap to add one now →</p>
            </button>
          )}

          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
            <p className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shake to trigger</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 ${shakeCount >= n ? "bg-red-500" : "bg-gray-700"
                    }`}
                />
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-gray-600">
              {isMonitoring ? "Shake your phone 2–3× to trigger alert" : "Monitoring stopped"}
            </p>

            {/* Sensor Debug Info */}
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${sensorStatus === "active" ? "bg-green-500 animate-pulse" :
                    sensorStatus === "denied" ? "bg-red-500" :
                      sensorStatus === "unavailable" ? "bg-gray-600" :
                        "bg-yellow-500 animate-pulse"
                  }`} />
                <span className="text-[10px] text-gray-500">
                  Sensor: {sensorStatus === "active" ? "Active" :
                    sensorStatus === "denied" ? "Permission denied" :
                      sensorStatus === "unavailable" ? "Not available" :
                        "Waiting..."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600">
                  Accel: {lastAccel}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${window.location.protocol === "https:"
                    ? "bg-green-900/40 text-green-500"
                    : "bg-red-900/40 text-red-500"
                  }`}>
                  {window.location.protocol === "https:" ? "🔒 HTTPS" : "⚠️ HTTP"}
                </span>
              </div>
            </div>

            {window.location.protocol !== "https:" && (
              <p className="mt-2 text-[10px] text-yellow-600">
                ⚠️ Shake detection requires HTTPS. Use the HTTPS URL to enable accelerometer access.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <button
              onPointerDown={() => { setPressing(true); simulateShake(); }}
              onPointerUp={() => setPressing(false)}
              onPointerLeave={() => setPressing(false)}
              onClick={sosTriggered ? onResetSOS : onManualSOS}
              className={`sos-btn relative flex h-44 w-44 flex-col items-center justify-center rounded-full text-white transition-all ${sosTriggered ? "bg-orange-600" : "bg-red-600"
                } ${pressing ? "shake-btn" : ""}`}
              style={{
                boxShadow: pressing
                  ? `0 2px 12px rgba(220,38,38,0.7)`
                  : `0 8px 40px rgba(220,38,38,0.5)`,
                transform: pressing ? "scale(0.95)" : "scale(1)",
              }}
            >
              <span className="text-4xl font-black">{sosTriggered ? "RESET" : "SOS"}</span>
              <span className="mt-1 text-xs font-medium opacity-80">
                {sosTriggered ? "Tap to reset" : "Tap for emergency"}
              </span>
            </button>
          </div>

          {sosTriggered && (
            <div className="space-y-2">
              <button
                onClick={sendWhatsApp}
                className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition-all active:scale-95 active:bg-green-700"
              >
                📲 Resend WhatsApp SOS
              </button>
              {onSiren && (
                <button
                  onClick={onSiren}
                  className="w-full rounded-xl bg-red-700 py-3.5 text-sm font-bold text-white transition-all active:scale-95"
                >
                  🚨 Activate Siren & Strobe
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
