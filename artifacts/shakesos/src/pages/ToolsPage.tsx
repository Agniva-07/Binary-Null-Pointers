import { useState } from "react";

interface ToolsPageProps {
    onBack: () => void;
    onSiren: () => void;
    onFakeCall: () => void;
    onFlashlight: () => void;
    onStealth: () => void;
    onLiveLocation: () => void;
    onChecklist: () => void;
    onNearbyServices: () => void;
    fallDetectionEnabled: boolean;
    onToggleFallDetection: () => void;
    isRecording: boolean;
    onToggleRecording: () => void;
    audioClips: Array<{ url: string; timestamp: number; duration: number }>;
    onDownloadClip: (clip: { url: string; blob: Blob; timestamp: number; duration: number }) => void;
}

export default function ToolsPage({
    onBack,
    onSiren,
    onFakeCall,
    onFlashlight,
    onStealth,
    onLiveLocation,
    onChecklist,
    onNearbyServices,
    fallDetectionEnabled,
    onToggleFallDetection,
    isRecording,
    onToggleRecording,
    audioClips,
}: ToolsPageProps) {
    const [fakeCallName, setFakeCallName] = useState(
        localStorage.getItem("shakesos-fakecall-name") || "Mom"
    );

    const saveFakeCallName = () => {
        localStorage.setItem("shakesos-fakecall-name", fakeCallName.trim() || "Mom");
    };

    return (
        <div className="flex min-h-screen flex-col bg-background px-5 py-8 pb-24">
            <div className="w-full max-w-sm mx-auto">
                <button
                    onClick={onBack}
                    className="mb-6 flex items-center gap-2 text-sm text-gray-400"
                >
                    ← Back
                </button>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">🛡️ Safety Tools</h1>
                    <p className="text-sm text-gray-400">
                        Advanced features to keep you safe
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Siren & Strobe */}
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">🚨</span>
                                    <h3 className="font-semibold text-white">Siren & Strobe</h3>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Full-screen flashing red/white with loud alarm siren. Use to draw attention or deter threats.
                                </p>
                            </div>
                            <button
                                onClick={onSiren}
                                className="shrink-0 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform"
                                style={{ boxShadow: "0 4px 16px rgba(220,38,38,0.4)" }}
                            >
                                Activate
                            </button>
                        </div>
                    </div>

                    {/* Flashlight SOS Morse Code — NEW */}
                    <div className="rounded-2xl border border-yellow-800/30 bg-yellow-950/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">🔦</span>
                                    <h3 className="font-semibold text-white">SOS Flash (Morse)</h3>
                                    <span className="text-[9px] bg-yellow-600/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Flash your torch in SOS morse code (··· ─── ···). Visual distress signal that works without sound.
                                </p>
                            </div>
                            <button
                                onClick={onFlashlight}
                                className="shrink-0 rounded-xl bg-yellow-600 px-4 py-2.5 text-sm font-bold text-black active:scale-95 transition-transform"
                                style={{ boxShadow: "0 4px 16px rgba(202,138,4,0.4)" }}
                            >
                                Flash
                            </button>
                        </div>
                    </div>

                    {/* Fake Call */}
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">📞</span>
                                    <h3 className="font-semibold text-white">Fake Call</h3>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Simulate an incoming phone call to escape uncomfortable situations.
                                </p>
                            </div>
                            <button
                                onClick={onFakeCall}
                                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform"
                                style={{ boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}
                            >
                                Call Now
                            </button>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                Caller Name
                            </label>
                            <input
                                type="text"
                                value={fakeCallName}
                                onChange={(e) => setFakeCallName(e.target.value)}
                                onBlur={saveFakeCallName}
                                placeholder="Mom"
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/60"
                            />
                        </div>
                    </div>

                    {/* Stealth/Discreet Mode — NEW */}
                    <div className="rounded-2xl border border-purple-800/30 bg-purple-950/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">🌙</span>
                                    <h3 className="font-semibold text-white">Stealth Mode</h3>
                                    <span className="text-[9px] bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Disguise app as a calculator. Enter code "911911" to unlock SOS. For domestic violence situations.
                                </p>
                            </div>
                            <button
                                onClick={onStealth}
                                className="shrink-0 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform"
                                style={{ boxShadow: "0 4px 16px rgba(147,51,234,0.4)" }}
                            >
                                Hide
                            </button>
                        </div>
                    </div>

                    {/* Fall Detection */}
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">🤸</span>
                                    <h3 className="font-semibold text-white">Fall Detection</h3>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Detects sudden falls using your phone's accelerometer. Auto-triggers SOS if you don't respond.
                                </p>
                            </div>
                            <button
                                onClick={onToggleFallDetection}
                                className={`shrink-0 h-7 w-12 rounded-full transition-all duration-300 relative ${fallDetectionEnabled ? "bg-green-600" : "bg-gray-700"
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${fallDetectionEnabled ? "translate-x-5" : "translate-x-0.5"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Audio Recording */}
                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">🎤</span>
                                    <h3 className="font-semibold text-white">Audio Recording</h3>
                                    {isRecording && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                            REC
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">
                                    {isRecording
                                        ? "Recording audio... Evidence is being captured."
                                        : "Start covert recording to capture audio evidence when you feel unsafe."}
                                </p>
                            </div>
                            <button
                                onClick={onToggleRecording}
                                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform ${isRecording ? "bg-orange-600" : "bg-purple-600"
                                    }`}
                            >
                                {isRecording ? "Stop" : "Record"}
                            </button>
                        </div>

                        {/* Saved Clips */}
                        {audioClips.length > 0 && (
                            <div className="mt-3 border-t border-gray-800 pt-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Saved Recordings ({audioClips.length})
                                </p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {audioClips.map((clip, idx) => (
                                        <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-800 p-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs">🎵</span>
                                                <div>
                                                    <p className="text-xs text-white font-medium">
                                                        Recording {idx + 1}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {new Date(clip.timestamp).toLocaleTimeString()} · {clip.duration}s
                                                    </p>
                                                </div>
                                            </div>
                                            <audio src={clip.url} controls className="h-6 w-24" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NEW Feature Links Section */}
                    <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            More Safety Features
                        </p>
                        <div className="space-y-2">
                            {/* Live Location */}
                            <button
                                onClick={onLiveLocation}
                                className="w-full flex items-center gap-3 rounded-2xl border border-green-800/30 bg-green-950/10 p-4 text-left transition-all active:scale-[0.98]"
                            >
                                <span className="text-2xl">📍</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-white">Live Location Sharing</h3>
                                        <span className="text-[9px] bg-green-600/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Share real-time GPS tracking link with anyone</p>
                                </div>
                                <span className="text-gray-600">→</span>
                            </button>

                            {/* Emergency Checklist */}
                            <button
                                onClick={onChecklist}
                                className="w-full flex items-center gap-3 rounded-2xl border border-blue-800/30 bg-blue-950/10 p-4 text-left transition-all active:scale-[0.98]"
                            >
                                <span className="text-2xl">📋</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-white">Safety Checklist</h3>
                                        <span className="text-[9px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Pre-configured emergency preparation plan</p>
                                </div>
                                <span className="text-gray-600">→</span>
                            </button>

                            {/* Nearby Services */}
                            <button
                                onClick={onNearbyServices}
                                className="w-full flex items-center gap-3 rounded-2xl border border-red-800/30 bg-red-950/10 p-4 text-left transition-all active:scale-[0.98]"
                            >
                                <span className="text-2xl">🏥</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-white">Nearby Emergency Services</h3>
                                        <span className="text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Hospitals, police & shelters near you</p>
                                </div>
                                <span className="text-gray-600">→</span>
                            </button>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">💡 Tips</p>
                        <ul className="space-y-1.5 text-xs text-gray-400">
                            <li>• <strong className="text-gray-300">Siren</strong> — Use in parking lots or dark streets to attract help</li>
                            <li>• <strong className="text-gray-300">SOS Flash</strong> — Visual morse code signal when you can't make noise</li>
                            <li>• <strong className="text-gray-300">Stealth Mode</strong> — Hides app as a calculator for safety</li>
                            <li>• <strong className="text-gray-300">Fake Call</strong> — Perfect for escaping awkward or unsafe situations</li>
                            <li>• <strong className="text-gray-300">Fall Detection</strong> — Great for elderly family members or solo hikers</li>
                            <li>• <strong className="text-gray-300">Audio Recording</strong> — Evidence capture for harassment situations</li>
                            <li>• <strong className="text-gray-300">Live Location</strong> — Let someone track your journey in real-time</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
