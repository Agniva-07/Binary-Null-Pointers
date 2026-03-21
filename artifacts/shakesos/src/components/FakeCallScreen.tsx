import { useState, useEffect, useCallback, useRef } from "react";

interface FakeCallScreenProps {
    onClose: () => void;
}

export default function FakeCallScreen({ onClose }: FakeCallScreenProps) {
    const [phase, setPhase] = useState<"ringing" | "answered" | "ended">("ringing");
    const [callTime, setCallTime] = useState(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const callerName = localStorage.getItem("shakesos-fakecall-name") || "Mom";

    // Generate ringtone-like sound
    const playRingtone = useCallback(() => {
        try {
            if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
                audioCtxRef.current = new (
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
                )();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") ctx.resume();

            const playTone = (freq: number, startTime: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = "sine";
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            // UK-style ringtone: two-tone burst
            const now = ctx.currentTime;
            playTone(440, now, 0.3);
            playTone(480, now, 0.3);
            playTone(440, now + 0.35, 0.3);
            playTone(480, now + 0.35, 0.3);
        } catch { }
    }, []);

    // Start ringing on mount
    useEffect(() => {
        if (phase === "ringing") {
            playRingtone();
            ringIntervalRef.current = setInterval(playRingtone, 2000);
        }

        return () => {
            if (ringIntervalRef.current) {
                clearInterval(ringIntervalRef.current);
                ringIntervalRef.current = null;
            }
        };
    }, [phase, playRingtone]);

    // Call timer
    useEffect(() => {
        if (phase === "answered") {
            if (ringIntervalRef.current) {
                clearInterval(ringIntervalRef.current);
                ringIntervalRef.current = null;
            }
            intervalRef.current = setInterval(() => {
                setCallTime((t) => t + 1);
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [phase]);

    const handleAnswer = () => {
        setPhase("answered");
        setCallTime(0);

        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    };

    const handleDecline = () => {
        setPhase("ended");
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch { }
        }
        setTimeout(onClose, 500);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
            {/* Top status bar */}
            <div className="w-full px-6 pt-12 pb-4 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {phase === "ringing" ? "Incoming call" : phase === "answered" ? "Ongoing call" : "Call ended"}
                </p>
            </div>

            {/* Caller Info */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Avatar */}
                <div className={`relative mb-6 ${phase === "ringing" ? "fake-call-pulse" : ""}`}>
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl">
                        {callerName.charAt(0).toUpperCase()}
                    </div>
                    {phase === "ringing" && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 pulse-ring" />
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 pulse-ring" style={{ animationDelay: "0.7s" }} />
                        </>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-white mb-1">{callerName}</h1>
                <p className="text-lg text-gray-400">
                    {phase === "ringing" ? "Mobile" : phase === "answered" ? formatTime(callTime) : "Call ended"}
                </p>
            </div>

            {/* Call Buttons */}
            <div className="w-full max-w-sm px-8 pb-16">
                {phase === "ringing" && (
                    <div className="flex items-center justify-between">
                        {/* Decline */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={handleDecline}
                                className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg active:scale-95 transition-transform"
                                style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.5)" }}
                            >
                                ✕
                            </button>
                            <span className="text-xs text-gray-400">Decline</span>
                        </div>

                        {/* Answer */}
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={handleAnswer}
                                className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl shadow-lg active:scale-95 transition-transform answer-bounce"
                                style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.5)" }}
                            >
                                📞
                            </button>
                            <span className="text-xs text-gray-400">Accept</span>
                        </div>
                    </div>
                )}

                {phase === "answered" && (
                    <div className="flex flex-col items-center gap-6">
                        {/* In-call controls */}
                        <div className="grid grid-cols-3 gap-6 w-full max-w-xs mb-4">
                            <div className="flex flex-col items-center gap-1">
                                <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center text-lg">
                                    🔇
                                </div>
                                <span className="text-xs text-gray-500">Mute</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center text-lg">
                                    ⌨️
                                </div>
                                <span className="text-xs text-gray-500">Keypad</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center text-lg">
                                    🔊
                                </div>
                                <span className="text-xs text-gray-500">Speaker</span>
                            </div>
                        </div>

                        {/* End Call */}
                        <button
                            onClick={handleDecline}
                            className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl shadow-lg active:scale-95 transition-transform"
                            style={{ boxShadow: "0 4px 20px rgba(220,38,38,0.5)" }}
                        >
                            ✕
                        </button>
                        <span className="text-xs text-gray-400">End Call</span>
                    </div>
                )}
            </div>
        </div>
    );
}
