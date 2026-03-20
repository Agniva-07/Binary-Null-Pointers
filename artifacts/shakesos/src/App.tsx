import { useState, useCallback } from "react";
import { Router as WouterRouter, Switch, Route } from "wouter";
import Home from "@/pages/Home";
import ContactSetup from "@/pages/ContactSetup";
import SOSScreen from "@/pages/SOSScreen";
import EmergencyModal from "@/components/EmergencyModal";
import InstallPrompt from "@/components/InstallPrompt";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { useGeolocation } from "@/hooks/useGeolocation";

export type AppPage = "home" | "contact" | "sos";

function App() {
  const [page, setPage] = useState<AppPage>("home");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  const { location, requestLocation } = useGeolocation();

  const onShakeDetected = useCallback(() => {
    if (!isMonitoring || showModal || sosTriggered) return;
    setShowModal(true);
  }, [isMonitoring, showModal, sosTriggered]);

  useShakeDetection({ onShake: onShakeDetected, enabled: isMonitoring });

  const handleImOK = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleHelpMe = useCallback(() => {
    setShowModal(false);
    setSosTriggered(true);
    setPage("sos");
  }, []);

  const handleAutoTrigger = useCallback(() => {
    setShowModal(false);
    setSosTriggered(true);
    setPage("sos");
  }, []);

  const handleStartMonitoring = useCallback(() => {
    requestLocation();
    setIsMonitoring(true);
    setPage("sos");
  }, [requestLocation]);

  const handleStopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    setSosTriggered(false);
    setPage("home");
  }, []);

  const handleManualSOS = useCallback(() => {
    setSosTriggered(true);
  }, []);

  const handleResetSOS = useCallback(() => {
    setSosTriggered(false);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
        <Switch>
          <Route path="/">
            {page === "home" && (
              <Home
                onStart={handleStartMonitoring}
                onContact={() => setPage("contact")}
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
              />
            )}
          </Route>
        </Switch>
      </WouterRouter>

      {showModal && (
        <EmergencyModal
          onOK={handleImOK}
          onHelp={handleHelpMe}
          onAutoTrigger={handleAutoTrigger}
        />
      )}

      <InstallPrompt />
    </div>
  );
}

export default App;
