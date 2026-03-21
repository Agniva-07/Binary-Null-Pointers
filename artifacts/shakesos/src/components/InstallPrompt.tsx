import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("shakesos-install-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("shakesos-install-dismissed", "1");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 slide-up">
      <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-gray-900 p-4 shadow-2xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-lg font-black text-white">
          S
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install ShakeSOS</p>
          <p className="text-xs text-gray-400">Add to home screen for quick access</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg bg-gray-700 px-2 py-1.5 text-xs text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
