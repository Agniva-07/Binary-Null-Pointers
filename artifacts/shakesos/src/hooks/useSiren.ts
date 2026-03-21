import { useRef, useState, useCallback, useEffect } from "react";

export function useSiren() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const lfoRef = useRef<OscillatorNode | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isStrobe, setIsStrobe] = useState(false);

    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
            audioCtxRef.current = new (
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            )();
        }
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const startSiren = useCallback(() => {
        if (isActive) return;

        try {
            const ctx = getAudioContext();

            // Main oscillator — rising/falling siren
            const osc = ctx.createOscillator();
            osc.type = "sawtooth";
            osc.frequency.value = 800;

            // LFO to modulate the siren pitch up and down
            const lfo = ctx.createOscillator();
            lfo.type = "triangle";
            lfo.frequency.value = 2; // 2 sweeps per second

            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 400; // modulation range: 800 ± 400 Hz

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            // Main gain node
            const gain = ctx.createGain();
            gain.gain.value = 0.6;

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            lfo.start();

            oscillatorRef.current = osc;
            lfoRef.current = lfo;
            gainNodeRef.current = gain;

            // Strobe effect toggle
            setIsStrobe(true);

            setIsActive(true);
        } catch (err) {
            console.error("Failed to start siren:", err);
        }
    }, [isActive, getAudioContext]);

    const stopSiren = useCallback(() => {
        try {
            if (oscillatorRef.current) {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
                oscillatorRef.current = null;
            }
            if (lfoRef.current) {
                lfoRef.current.stop();
                lfoRef.current.disconnect();
                lfoRef.current = null;
            }
            if (gainNodeRef.current) {
                gainNodeRef.current.disconnect();
                gainNodeRef.current = null;
            }
        } catch { }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setIsStrobe(false);
        setIsActive(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSiren();
            if (audioCtxRef.current) {
                try {
                    audioCtxRef.current.close();
                } catch { }
            }
        };
    }, [stopSiren]);

    return { isActive, isStrobe, startSiren, stopSiren };
}
