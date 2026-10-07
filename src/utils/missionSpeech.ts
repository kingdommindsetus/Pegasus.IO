// Voice is optional: a failed or stalled player must never block durable work.
export async function playMissionSpeech(
  audio: HTMLAudioElement | null,
  fallback: (done: () => void) => void,
  timeoutMs = 45_000,
): Promise<void> {
  await new Promise<void>((resolve) => {
    let settled = false;
    let fallbackStarted = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      }
      resolve();
    };
    const useFallback = () => {
      if (settled || fallbackStarted) return;
      fallbackStarted = true;
      audio?.pause();
      try { fallback(finish); } catch { finish(); }
    };
    const timer = setTimeout(finish, timeoutMs);
    if (!audio) { useFallback(); return; }
    // Register before play(), including players that finish immediately.
    audio.onended = finish;
    audio.onerror = useFallback;
    try { void audio.play().catch(useFallback); } catch { useFallback(); }
  });
}
