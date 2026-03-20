import { useState } from "react";

interface ContactSetupProps {
  onBack: () => void;
}

export default function ContactSetup({ onBack }: ContactSetupProps) {
  const [phone, setPhone] = useState(localStorage.getItem("shakesos-contact") || "");
  const [name, setName] = useState(localStorage.getItem("shakesos-contact-name") || "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!phone.trim()) return;
    localStorage.setItem("shakesos-contact", phone.trim());
    localStorage.setItem("shakesos-contact-name", name.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem("shakesos-contact");
    localStorage.removeItem("shakesos-contact-name");
    setPhone("");
    setName("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-gray-400"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Emergency Contact</h1>
          <p className="mt-1 text-sm text-gray-400">
            This person will receive your SOS via WhatsApp
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Contact Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mom, Best Friend"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Phone Number (with country code)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Include country code (e.g. +1 for US, +44 for UK)
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preview SOS message</p>
            <p className="text-sm text-gray-300">
              🆘 SOS EMERGENCY ALERT! I need help. My location:{" "}
              <span className="text-red-400">https://www.google.com/maps?q=LAT,LNG</span>{" "}
              — Please call emergency services immediately! Sent via ShakeSOS.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={!phone.trim()}
            className={`w-full rounded-xl py-4 text-base font-bold text-white transition-all active:scale-95 ${
              saved
                ? "bg-green-600"
                : !phone.trim()
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-red-600 active:bg-red-700"
            }`}
            style={phone.trim() && !saved ? { boxShadow: "0 4px 20px rgba(220,38,38,0.4)" } : {}}
          >
            {saved ? "✅ Saved!" : "Save Contact"}
          </button>

          {phone && (
            <button
              onClick={handleClear}
              className="w-full rounded-xl border border-gray-700 py-3 text-sm text-gray-400 transition-all active:bg-gray-800"
            >
              Clear Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
