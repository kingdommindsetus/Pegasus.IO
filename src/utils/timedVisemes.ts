export type RuntimeMorphs = Record<string, number>;

const REST: RuntimeMorphs = {};
const MAP: Record<string, RuntimeMorphs> = {
  a: { jawOpen: 0.72, viseme_aa: 1 },
  e: { jawOpen: 0.22, viseme_ee: 1 },
  i: { jawOpen: 0.24, viseme_ee: 0.72 },
  o: { jawOpen: 0.48, viseme_oh: 1 },
  u: { jawOpen: 0.30, viseme_oh: 0.88 },
  m: { viseme_mbp: 1 },
  b: { viseme_mbp: 1 },
  p: { viseme_mbp: 1 },
  f: { jawOpen: 0.12, viseme_ee: 0.24 },
  v: { jawOpen: 0.12, viseme_ee: 0.24 }
};

const PAIRS: Record<string, RuntimeMorphs> = {
  th: { jawOpen: 0.18, viseme_aa: 0.16 },
  oo: { jawOpen: 0.30, viseme_oh: 0.88 },
  oh: { jawOpen: 0.48, viseme_oh: 1 },
  ee: { jawOpen: 0.22, viseme_ee: 1 }
};

export interface TimedViseme {
  tMs: number;
  durationMs: number;
  weights: RuntimeMorphs;
}

export function buildTimedVisemes(text: string, frameMs = 72): TimedViseme[] {
  const value = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const frames: TimedViseme[] = [];
  let i = 0;
  let tMs = 0;
  while (i < value.length) {
    let weights = REST;
    if (value[i] === ' ') {
      i += 1;
    } else {
      const pair = value.slice(i, i + 2);
      if (PAIRS[pair]) {
        weights = PAIRS[pair];
        i += 2;
      } else {
        weights = MAP[value[i]] || REST;
        i += 1;
      }
    }
    frames.push({ tMs, durationMs: frameMs, weights });
    tMs += frameMs;
  }
  return frames.length ? frames : [{ tMs: 0, durationMs: frameMs, weights: REST }];
}

let active: { startedAt: number; frames: TimedViseme[] } | null = null;

export function startTimedVisemes(text: string): void {
  active = { startedAt: performance.now(), frames: buildTimedVisemes(text) };
}

export function stopTimedVisemes(): void {
  active = null;
}

export function getTimedMorphs(): RuntimeMorphs | null {
  if (!active) return null;
  const elapsed = performance.now() - active.startedAt;
  const last = active.frames[active.frames.length - 1];
  if (elapsed > last.tMs + last.durationMs + 80) return null;
  const index = Math.min(active.frames.length - 1, Math.floor(elapsed / 72));
  return active.frames[index]?.weights || REST;
}
