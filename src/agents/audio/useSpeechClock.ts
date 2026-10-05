import { useEffect, useRef, useState } from "react";
import type { SpeechResult, Viseme } from "../types";
import { cueAtTime } from "../rig/visemes";

export function useSpeechClock(
  speech: SpeechResult | null | undefined,
  playing: boolean,
  audioElement?: HTMLAudioElement | null
) {
  const [viseme, setViseme] = useState<Viseme>("REST");
  const [progress, setProgress] = useState(0);
  const startedAt = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || !speech) {
      setViseme("REST");
      setProgress(0);
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }

    startedAt.current = performance.now();

    const tick = () => {
      const time = audioElement
        ? audioElement.currentTime
        : (performance.now() - startedAt.current) / 1000;

      const cue = cueAtTime(speech.visemes, time);
      setViseme(cue?.viseme ?? "REST");
      setProgress(Math.min(1, time / Math.max(speech.duration, 0.01)));

      if (time < speech.duration) raf.current = requestAnimationFrame(tick);
      else setViseme("REST");
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [speech, playing, audioElement]);

  return { viseme, progress };
}
