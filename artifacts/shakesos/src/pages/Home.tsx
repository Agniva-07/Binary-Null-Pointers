import { useState } from "react";

interface HomeProps {
  onStart: () => void;
  onContact: () => void;
  isMonitoring: boolean;
  isRecording: boolean;
  onStealth?: () => void;
}

export default function Home({ onStart, onContact, isMonitoring, isRecording, onStealth }: HomeProps) {
  const [pressing, setPressing] = useState(false);
  const contact = localStorage.getItem("shakesos-contact") || "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-10 pb-28">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-lg"
              style={{ boxShadow: "0 8px 32px rgba(220,38,38,0.4)" }}
              onDoubleClick={onStealth}
            >
              <span className="text-2xl font-black text-white">SOS</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white">ShakeSOS</h1>
          <p className="mt-1 text-sm text-gray-400">Emergency Alert System</p>

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-4 mt-3">
            {isMonitoring && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600/20 px-3 py-1 text-xs font-medium text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Monitoring
              </span>
            )}
            {isRecording && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Recording
              </span>
            )}
          </div>
        </div>

        <div className="mb-8 space-y-3 rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">How It Works</h2>
          <div className="space-y-2.5">
            {[
              { icon: "📳", text: "Shake your phone 2–3 times to trigger an alert" },
              { icon: "⚠️", text: "A popup asks if you're OK with a 15-second timer" },
              { icon: "🆘", text: "If no response, SOS is sent automatically" },
              { icon: "📍", text: "Your location is shared via WhatsApp" },
              { icon: "🎤", text: "Audio recording starts automatically on SOS" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mb-6 grid grid-cols-3 gap-2.5">
          {[
            { icon: "🚨", label: "Siren", sub: "In Tools" },
            { icon: "📞", label: "Fake Call", sub: "Tab" },
            { icon: "⏱️", label: "Timer", sub: "Tab" },
            { icon: "🤸", label: "Fall Detect", sub: "Tools" },
            { icon: "🔦", label: "SOS Flash", sub: "Tools" },
            { icon: "🌙", label: "Stealth", sub: "Double-tap logo" },
            { icon: "📍", label: "Live Loc", sub: "Tools" },
            { icon: "📋", label: "Checklist", sub: "Tools" },
            { icon: "🏥", label: "Services", sub: "Tools" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/30 p-2.5 text-center">
              <span className="text-xl mb-0.5 block">{item.icon}</span>
              <p className="text-[11px] font-medium text-gray-300">{item.label}</p>
              <p className="text-[9px] text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>

        {!contact && (
          <div className="mb-4 rounded-xl border border-yellow-800/40 bg-yellow-950/20 p-3.5">
            <div className="flex items-start gap-2.5">
              <span>⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-400">No emergency contact set</p>
                <p className="text-xs text-yellow-600 mt-0.5">Add a contact so SOS messages can be sent.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-center">
          <button
            onPointerDown={() => setPressing(true)}
            onPointerUp={() => setPressing(false)}
            onPointerLeave={() => setPressing(false)}
            onClick={onStart}
            className="sos-btn relative flex h-48 w-48 flex-col items-center justify-center rounded-full bg-red-600 text-white transition-all active:scale-95"
            style={{
              boxShadow: pressing
                ? "0 4px 16px rgba(220,38,38,0.6)"
                : "0 8px 40px rgba(220,38,38,0.5)",
              transform: pressing ? "scale(0.96)" : "scale(1)",
            }}
          >
            <span className="text-5xl font-black">SOS</span>
            <span className="mt-1 text-sm font-medium opacity-90">Activate Mode</span>
          </button>
        </div>

        <button
          onClick={onContact}
          className="w-full rounded-xl border border-gray-700 bg-gray-800/80 py-3.5 text-sm font-semibold text-white transition-all active:bg-gray-700"
        >
          👤 {contact ? `Contact: ${contact}` : "Set Emergency Contact"}
        </button>
      </div>
    </div>
  );
}
