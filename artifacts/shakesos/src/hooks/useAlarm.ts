import { useRef, useCallback, useEffect } from "react";

export function useAlarm() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const isPlayingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    oscillatorsRef.current.forEach((osc) => {
      try { osc.stop(); } catch { }
    });
    oscillatorsRef.current = [];
  }, []);

  const playBeep = useCallback((ctx: AudioContext, freq: number, duration: number, delay: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "square";
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
    oscillatorsRef.current.push(osc);
  }, []);

  const startAlarm = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      const playPattern = () => {
        if (!isPlayingRef.current) return;
        playBeep(ctx, 880, 0.15, 0);
        playBeep(ctx, 1100, 0.15, 0.2);
        playBeep(ctx, 880, 0.15, 0.4);
        playBeep(ctx, 1100, 0.15, 0.6);
      };

      playPattern();
      intervalRef.current = setInterval(playPattern, 900);
    } catch {
      // Audio context not supported
    }
  }, [playBeep]);

  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch { }
      }
    };
  }, [stopAlarm]);

  return { startAlarm, stopAlarm };
}
