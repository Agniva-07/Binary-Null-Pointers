import { useState, useCallback } from "react";
import { Router as WouterRouter, Switch, Route } from "wouter";
import Home from "@/pages/Home";
import ContactSetup from "@/pages/ContactSetup";
import SOSScreen from "@/pages/SOSScreen";
import ToolsPage from "@/pages/ToolsPage";
import EmergencyModal from "@/components/EmergencyModal";
import InstallPrompt from "@/components/InstallPrompt";
import FakeCallScreen from "@/components/FakeCallScreen";
import SirenMode from "@/components/SirenMode";
import SafetyTimer from "@/components/SafetyTimer";
import BottomNav from "@/components/BottomNav";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFallDetection } from "@/hooks/useFallDetection";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

export type AppPage = "home" | "contact" | "sos" | "timer" | "fakecall" | "tools";

function App() {
  const [page, setPage] = useState<AppPage>("home");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [showSiren, setShowSiren] = useState(false);
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false);

  const { location, requestLocation } = useGeolocation();
  const {
    isRecording,
    clips,
    startRecording,
    stopRecording,
    downloadClip,
  } = useAudioRecorder();

  // Shake detection triggers emergency modal
  const onShakeDetected = useCallback(() => {
    if (!isMonitoring || showModal || sosTriggered) return;
    setShowModal(true);
  }, [isMonitoring, showModal, sosTriggered]);

  const { sensorStatus, lastAccel } = useShakeDetection({ onShake: onShakeDetected, enabled: isMonitoring });

  // Fall detection triggers emergency modal
  const onFallDetected = useCallback(() => {
    if (showModal || sosTriggered) return;
    setShowModal(true);
  }, [showModal, sosTriggered]);

  useFallDetection({ onFallDetected, enabled: fallDetectionEnabled });

  const handleImOK = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleHelpMe = useCallback(() => {
    setShowModal(false);
    setSosTriggered(true);
    setPage("sos");
    // Auto-start recording on SOS
    startRecording();
  }, [startRecording]);

  const handleAutoTrigger = useCallback(() => {
    setShowModal(false);
    setSosTriggered(true);
    setPage("sos");
    // Auto-start recording on SOS
    startRecording();
  }, [startRecording]);

  const handleStartMonitoring = useCallback(() => {
    requestLocation();
    setIsMonitoring(true);
    setPage("sos");
  }, [requestLocation]);

  const handleStopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setSosTriggered(false);
    if (isRecording) stopRecording();
    setPage("home");
  }, [isRecording, stopRecording]);

  const handleManualSOS = useCallback(() => {
    setSosTriggered(true);
    startRecording();
  }, [startRecording]);

  const handleResetSOS = useCallback(() => {
    setSosTriggered(false);
    if (isRecording) stopRecording();
  }, [isRecording, stopRecording]);

  // Safety Timer SOS
  const handleTimerSOS = useCallback(() => {
    requestLocation();
    setSosTriggered(true);
    setIsMonitoring(true);
    setPage("sos");
    startRecording();
  }, [requestLocation, startRecording]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleNavigate = useCallback((newPage: AppPage) => {
    // If we're in SOS monitoring mode and user navigates away, don't kill the monitoring
    setPage(newPage);
  }, []);

  // Should we show the bottom nav?
  const showBottomNav = !showFakeCall && !showSiren && !showModal && page !== "sos" && page !== "contact";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
        <Switch>
          <Route path="/">
            {page === "home" && (
              <Home
                onStart={handleStartMonitoring}
                onContact={() => setPage("contact")}
                isMonitoring={isMonitoring}
                isRecording={isRecording}
              />
            )}
            {page === "contact" && (
              <ContactSetup onBack={() => setPage("home")} />
            )}
            {page === "sos" && (
              <SOSScreen
                isMonitoring={isMonitoring}
                sosTriggered={sosTriggered}
                location={location}
                onManualSOS={handleManualSOS}
                onResetSOS={handleResetSOS}
                onStop={handleStopMonitoring}
                onContact={() => setPage("contact")}
                isRecording={isRecording}
                onSiren={() => setShowSiren(true)}
                sensorStatus={sensorStatus}
                lastAccel={lastAccel}
              />
            )}
            {page === "timer" && (
              <SafetyTimer
                onSOS={handleTimerSOS}
                onBack={() => setPage("home")}
              />
            )}
            {page === "fakecall" && (
              <div className="flex min-h-screen flex-col bg-background px-5 py-8 pb-24">
                <div className="w-full max-w-sm mx-auto">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">📞 Fake Call</h1>
                    <p className="text-sm text-gray-400">
                      Simulate an incoming call to escape uncomfortable situations
                    </p>
                  </div>

                  <FakeCallSetup onTrigger={() => setShowFakeCall(true)} />
                </div>
              </div>
            )}
            {page === "tools" && (
              <ToolsPage
                onBack={() => setPage("home")}
                onSiren={() => setShowSiren(true)}
                onFakeCall={() => setShowFakeCall(true)}
                fallDetectionEnabled={fallDetectionEnabled}
                onToggleFallDetection={() => setFallDetectionEnabled((v) => !v)}
                isRecording={isRecording}
                onToggleRecording={handleToggleRecording}
                audioClips={clips}
                onDownloadClip={downloadClip}
              />
            )}
          </Route>
        </Switch>
      </WouterRouter>

      {/* Emergency Modal Overlay */}
      {showModal && (
        <EmergencyModal
          onOK={handleImOK}
          onHelp={handleHelpMe}
          onAutoTrigger={handleAutoTrigger}
        />
      )}

      {/* Fake Call Overlay */}
      {showFakeCall && (
        <FakeCallScreen onClose={() => setShowFakeCall(false)} />
      )}

      {/* Siren Mode Overlay */}
      {showSiren && (
        <SirenMode onClose={() => setShowSiren(false)} />
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav currentPage={page} onNavigate={handleNavigate} />
      )}

      <InstallPrompt />
    </div>
  );
}

// Fake Call Setup sub-component
function FakeCallSetup({ onTrigger }: { onTrigger: () => void }) {
  const [callerName, setCallerName] = useState(
    localStorage.getItem("shakesos-fakecall-name") || "Mom"
  );
  const [delay, setDelay] = useState(5);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleStart = () => {
    localStorage.setItem("shakesos-fakecall-name", callerName.trim() || "Mom");
    setCountdown(delay);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onTrigger();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (countdown !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 fade-in">
        <div className="relative mb-6">
            <div className="h-28 w-28 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl">
            {callerName.charAt(0).toUpperCase()}
          </div>
          <div className="absolute inset-0 rounded-full bg-blue-500/20 pulse-ring" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{callerName} will call in</h2>
        <span className="text-5xl font-black text-blue-400 countdown-tick" key={countdown}>
          {countdown}s
        </span>
        <button
          onClick={() => setCountdown(null)}
          className="mt-8 rounded-xl border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-medium text-gray-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Caller Name */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Who's calling?
        </label>
        <input
          type="text"
          value={callerName}
          onChange={(e) => setCallerName(e.target.value)}
          placeholder="Mom"
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
      </div>

      {/* Delay */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Ring in...
        </label>
        <div className="flex gap-2">
          {[3, 5, 10, 15, 30].map((s) => (
            <button
              key={s}
              onClick={() => setDelay(s)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${delay === s
                ? "bg-blue-600 text-white"
                : "border border-gray-700 bg-gray-800 text-gray-400"
                }`}
            >
              {s}s
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📱 Preview</p>
        <p className="text-sm text-gray-300">
          A fake incoming call from <span className="text-blue-400 font-semibold">{callerName || "Mom"}</span> will
          appear in <span className="text-blue-400 font-semibold">{delay} seconds</span> with a ringtone.
        </p>
      </div>

      {/* Trigger Button */}
      <button
        onClick={handleStart}
        className="w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white transition-all active:scale-95"
        style={{ boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}
      >
        📞 Schedule Fake Call
      </button>
    </div>
  );
}

export default App;
