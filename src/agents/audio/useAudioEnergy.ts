import { useEffect, useRef, useState } from "react";

export function useAudioEnergy(
  audioElement: HTMLAudioElement | null | undefined,
  active: boolean
) {
  const [energy, setEnergy] = useState<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !audioElement) {
      setEnergy(null);
      return;
    }

    let cancelled = false;
    let context: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        setEnergy(null);
        return;
      }

      context = new AudioCtx();
      analyser = context.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.72;

      source = context.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(context.destination);

      if (context.state === "suspended") {
        void context.resume();
      }

      const bins = new Uint8Array(analyser.frequencyBinCount);
      let smoothed = 0;
      let lastEmit = 0;

      const tick = (now: number) => {
        if (cancelled || !analyser) return;

        analyser.getByteFrequencyData(bins);

        const count = Math.min(16, bins.length);
        let sum = 0;
        for (let i = 0; i < count; i += 1) sum += bins[i];

        const avg = count ? sum / count : 0;
        const normalized = Math.min(1, Math.max(0, avg / 140));

        // Fast attack, slower release: speech feels responsive without chatter.
        const blend = normalized > smoothed ? 0.42 : 0.18;
        smoothed += (normalized - smoothed) * blend;

        if (now - lastEmit >= 32) {
          setEnergy(smoothed < 0.035 ? 0 : smoothed);
          lastEmit = now;
        }

        raf.current = requestAnimationFrame(tick);
      };

      raf.current = requestAnimationFrame(tick);
    } catch (error) {
      console.warn("Pegasus audio analyser unavailable", error);
      setEnergy(null);
    }

    return () => {
      cancelled = true;
      if (raf.current) cancelAnimationFrame(raf.current);
      try { source?.disconnect(); } catch {}
      try { analyser?.disconnect(); } catch {}
      try { void context?.close(); } catch {}
      setEnergy(null);
    };
  }, [audioElement, active]);

  return energy;
}
