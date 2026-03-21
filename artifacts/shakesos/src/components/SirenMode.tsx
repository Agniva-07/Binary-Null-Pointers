import { useEffect, useState } from "react";
import { useSiren } from "@/hooks/useSiren";

interface SirenModeProps {
    onClose: () => void;
}

export default function SirenMode({ onClose }: SirenModeProps) {
    const { isActive, startSiren, stopSiren } = useSiren();
    const [strobeOn, setStrobeOn] = useState(false);

    // Start siren immediately
    useEffect(() => {
        startSiren();
        return () => stopSiren();
    }, [startSiren, stopSiren]);

    // Strobe effect - toggle every 100ms
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setStrobeOn((prev) => !prev);
        }, 100);

        return () => clearInterval(interval);
    }, [isActive]);

    // Try to use the flashlight via Torch API
    useEffect(() => {
        let track: MediaStreamTrack | null = null;
        let torchInterval: ReturnType<typeof setInterval> | null = null;

        const enableTorch = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
                track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };

                if (capabilities.torch) {
                    torchInterval = setInterval(async () => {
                        try {
                            await track!.applyConstraints({
                                advanced: [{ torch: true } as MediaTrackConstraintSet & { torch: boolean }],
                            } as MediaTrackConstraints);
                            setTimeout(async () => {
                                try {
                                    await track!.applyConstraints({
                                        advanced: [{ torch: false } as MediaTrackConstraintSet & { torch: boolean }],
                                    } as MediaTrackConstraints);
                                } catch { }
                            }, 200);
                        } catch { }
                    }, 500);
                }
            } catch {
                // Camera/torch not available
            }
        };

        enableTorch();

        return () => {
            if (torchInterval) clearInterval(torchInterval);
            if (track) track.stop();
        };
    }, []);

    const handleStop = () => {
        stopSiren();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-75"
            style={{
                backgroundColor: strobeOn ? "#ffffff" : "#dc2626",
            }}
        >
            {/* SOS Text */}
            <div className="text-center mb-12">
                <h1
                    className="text-8xl font-black mb-4 transition-colors duration-75"
                    style={{ color: strobeOn ? "#dc2626" : "#ffffff" }}
                >
                    SOS
                </h1>
                <p
                    className="text-2xl font-bold uppercase tracking-widest transition-colors duration-75"
                    style={{ color: strobeOn ? "#991b1b" : "#fca5a5" }}
                >
                    ⚠️ EMERGENCY ⚠️
                </p>
                <p
                    className="text-lg mt-2 transition-colors duration-75"
                    style={{ color: strobeOn ? "#7f1d1d" : "#fecaca" }}
                >
                    HELP NEEDED
                </p>
            </div>

            {/* Pulsing rings */}
            <div className="relative mb-12">
                <div className="h-20 w-20 rounded-full bg-white/20 pulse-ring absolute inset-0" />
                <div className="h-20 w-20 rounded-full bg-white/20 pulse-ring absolute inset-0" style={{ animationDelay: "0.5s" }} />
                <div className="h-20 w-20 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🚨</span>
                </div>
            </div>

            {/* Stop Button */}
            <button
                onClick={handleStop}
                className="px-12 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
                style={{
                    backgroundColor: strobeOn ? "#dc2626" : "#ffffff",
                    color: strobeOn ? "#ffffff" : "#dc2626",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
            >
                ■ STOP SIREN
            </button>

            <p
                className="mt-4 text-sm transition-colors duration-75"
                style={{ color: strobeOn ? "#991b1b" : "#fecaca" }}
            >
                Tap to stop the alarm
            </p>
        </div>
    );
}
