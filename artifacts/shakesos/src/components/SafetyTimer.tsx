import { useState, useEffect, useCallback, useRef } from "react";
import { useAlarm } from "@/hooks/useAlarm";

interface SafetyTimerProps {
    onSOS: () => void;
    onBack: () => void;
}

export default function SafetyTimer({ onSOS, onBack }: SafetyTimerProps) {
    const [isActive, setIsActive] = useState(false);
    const [duration, setDuration] = useState(15); // minutes
    const [timeLeft, setTimeLeft] = useState(0); // seconds
    const [showPinPrompt, setShowPinPrompt] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [destination, setDestination] = useState(
        localStorage.getItem("shakesos-destination") || ""
    );
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { startAlarm, stopAlarm } = useAlarm();

    const PIN = "1234"; // default pin

    const startTimer = useCallback(() => {
        if (!destination.trim()) return;
        localStorage.setItem("shakesos-destination", destination.trim());
        setTimeLeft(duration * 60);
        setIsActive(true);
    }, [duration, destination]);

    // Countdown timer
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Timer expired! Show PIN prompt
                    setShowPinPrompt(true);
                    startAlarm();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, timeLeft, startAlarm]);

    // Auto-SOS if no PIN entered within 30 seconds
    useEffect(() => {
        if (!showPinPrompt) return;

        const timeout = setTimeout(() => {
            stopAlarm();
            onSOS();
        }, 30000); // 30 seconds to enter PIN

        return () => clearTimeout(timeout);
    }, [showPinPrompt, stopAlarm, onSOS]);

    const handlePinSubmit = useCallback(() => {
        if (pinInput === PIN) {
            stopAlarm();
            setShowPinPrompt(false);
            setIsActive(false);
            setPinInput("");
        } else {
            setPinInput("");
            // Wrong pin - shake animation
            if (navigator.vibrate) navigator.vibrate(200);
        }
    }, [pinInput, stopAlarm]);

    const handleStop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        stopAlarm();
        setIsActive(false);
        setShowPinPrompt(false);
        setPinInput("");
        setTimeLeft(0);
    }, [stopAlarm]);

    const addTime = useCallback((minutes: number) => {
        setTimeLeft((prev) => prev + minutes * 60);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const progress = isActive ? (timeLeft / (duration * 60)) * 100 : 100;

    // PIN Prompt Overlay
    if (showPinPrompt) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 alarm-flash p-4">
                <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-gray-900 p-6 fade-in">
                    <div className="text-center mb-6">
                        <span className="text-5xl mb-4 block">⏰</span>
                        <h2 className="text-xl font-bold text-red-400 mb-2">Timer Expired!</h2>
                        <p className="text-sm text-gray-400">
                            Enter your PIN to confirm you are safe.
                            <br />
                            SOS will be sent automatically in 30 seconds.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter PIN"
                            className="w-full text-center text-3xl tracking-[0.5em] rounded-xl border border-gray-700 bg-gray-800 px-4 py-4 text-white placeholder-gray-600 outline-none focus:border-green-500/60"
                            autoFocus
                        />

                        <button
                            onClick={handlePinSubmit}
                            className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white active:scale-95"
                        >
                            ✅ I'm Safe
                        </button>

                        <button
                            onClick={() => { stopAlarm(); onSOS(); }}
                            className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold text-white active:scale-95"
                        >
                            🆘 Send SOS Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Active Timer View
    if (isActive) {
        return (
            <div className="flex min-h-screen flex-col bg-background px-5 py-8">
                <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center flex-1">
                    <button
                        onClick={handleStop}
                        className="self-start mb-8 flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3.5 py-2 text-sm font-medium text-gray-300"
                    >
                        ← Cancel
                    </button>

                    <div className="text-center mb-8">
                        <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Getting to</p>
                        <h2 className="text-xl font-bold text-white mb-1">{destination}</h2>
                    </div>

                    {/* Circular timer */}
                    <div className="relative h-52 w-52 mb-8">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                            <circle
                                cx="60" cy="60" r="54"
                                fill="none"
                                stroke="#1f2937"
                                strokeWidth="6"
                            />
                            <circle
                                cx="60" cy="60" r="54"
                                fill="none"
                                stroke={timeLeft < 60 ? "#ef4444" : timeLeft < 180 ? "#f59e0b" : "#22c55e"}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 54}`}
                                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-black ${timeLeft < 60 ? "text-red-400" : "text-white"}`}>
                                {formatTime(timeLeft)}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">remaining</span>
                        </div>
                    </div>

                    {/* Quick add time */}
                    <div className="flex gap-3 mb-8">
                        {[5, 10, 15].map((m) => (
                            <button
                                key={m}
                                onClick={() => addTime(m)}
                                className="rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-2.5 text-sm font-medium text-gray-300 active:bg-gray-700"
                            >
                                +{m} min
                            </button>
                        ))}
                    </div>

                    <div className="w-full space-y-3">
                        <button
                            onClick={handleStop}
                            className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white active:scale-95"
                        >
                            ✅ I Arrived Safely
                        </button>
                        <button
                            onClick={() => { stopAlarm(); onSOS(); }}
                            className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white active:scale-95"
                        >
                            🆘 Trigger SOS Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Setup View
    return (
        <div className="flex min-h-screen flex-col bg-background px-5 py-8">
            <div className="w-full max-w-sm mx-auto">
                <button
                    onClick={onBack}
                    className="mb-6 flex items-center gap-2 text-sm text-gray-400"
                >
                    ← Back
                </button>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">⏱️ Safety Timer</h1>
                    <p className="text-sm text-gray-400">
                        Set a timer for your journey. If you don't confirm arrival by entering your PIN,
                        an SOS will be sent automatically.
                    </p>
                </div>

                <div className="space-y-5">
                    {/* Destination */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Where are you going?
                        </label>
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g. Home, Office, Friend's house"
                            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/30 transition-all"
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Estimated travel time
                        </label>
                        <div className="flex gap-2">
                            {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setDuration(m)}
                                    className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${duration === m
                                            ? "bg-green-600 text-white"
                                            : "border border-gray-700 bg-gray-800 text-gray-400"
                                        }`}
                                >
                                    {m < 60 ? `${m}m` : "1h"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PIN Info */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">🔐 Safety PIN</p>
                        <p className="text-sm text-gray-300">
                            Your default PIN is <span className="text-green-400 font-mono font-bold">1234</span>.
                            You'll need this to confirm you arrived safely.
                        </p>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={startTimer}
                        disabled={!destination.trim()}
                        className={`w-full rounded-xl py-4 text-base font-bold text-white transition-all active:scale-95 ${!destination.trim()
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-green-600"
                            }`}
                        style={destination.trim() ? { boxShadow: "0 4px 20px rgba(34,197,94,0.4)" } : {}}
                    >
                        🛡️ Start Safety Timer
                    </button>
                </div>
            </div>
        </div>
    );
}
