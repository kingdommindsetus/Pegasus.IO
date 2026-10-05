import type { Viseme, VisemeCue } from "../types";

export type BlendshapeWeights = Record<string, number>;

export const VISEME_WEIGHTS: Record<Viseme, BlendshapeWeights> = {
  REST: { jawOpen: 0, mouthClose: 0.1, mouthFunnel: 0, mouthPucker: 0 },
  AA: { jawOpen: 0.78, mouthFunnel: 0.05, mouthStretchLeft: 0.08, mouthStretchRight: 0.08 },
  AE: { jawOpen: 0.58, mouthStretchLeft: 0.16, mouthStretchRight: 0.16 },
  AH: { jawOpen: 0.68, mouthFunnel: 0.06 },
  EE: { jawOpen: 0.28, mouthSmileLeft: 0.28, mouthSmileRight: 0.28, mouthStretchLeft: 0.24, mouthStretchRight: 0.24 },
  IH: { jawOpen: 0.26, mouthStretchLeft: 0.15, mouthStretchRight: 0.15 },
  OH: { jawOpen: 0.5, mouthFunnel: 0.72 },
  OU: { jawOpen: 0.3, mouthPucker: 0.82 },
  MBP: { jawOpen: 0, mouthClose: 1, mouthPressLeft: 0.32, mouthPressRight: 0.32 },
  FV: { jawOpen: 0.12, mouthLowerDownLeft: 0.16, mouthLowerDownRight: 0.16, mouthRollLower: 0.2 },
  L: { jawOpen: 0.31, mouthUpperUpLeft: 0.12, mouthUpperUpRight: 0.12 },
  SZ: { jawOpen: 0.16, mouthStretchLeft: 0.12, mouthStretchRight: 0.12 },
  TH: { jawOpen: 0.27, mouthLowerDownLeft: 0.08, mouthLowerDownRight: 0.08 },
  CH: { jawOpen: 0.22, mouthFunnel: 0.25 },
  R: { jawOpen: 0.22, mouthPucker: 0.22 },
  WQ: { jawOpen: 0.2, mouthPucker: 0.58 }
};

export function cueAtTime(cues: VisemeCue[], time: number): VisemeCue | undefined {
  return cues.find((cue) => time >= cue.start && time < cue.end);
}

const charMap: Array<[RegExp, Viseme]> = [
  [/[mbp]/i, "MBP"],
  [/[fv]/i, "FV"],
  [/th/i, "TH"],
  [/[szx]/i, "SZ"],
  [/[lr]/i, "L"],
  [/[wq]/i, "WQ"],
  [/[ou]/i, "OU"],
  [/[o]/i, "OH"],
  [/[ei]/i, "EE"],
  [/[a]/i, "AA"]
];

/**
 * DEV FALLBACK ONLY.
 * This is not phoneme alignment. Production TTS should return native viseme
 * timestamps or a forced-alignment service should generate them.
 */
export function estimateVisemesFromText(text: string, durationSeconds: number): VisemeCue[] {
  const tokens = text.match(/[a-z]+|[.,!?]/gi) ?? [];
  if (!tokens.length || durationSeconds <= 0) return [];
  const unit = durationSeconds / tokens.length;
  return tokens.map((token, index) => {
    const punctuation = /^[.,!?]$/.test(token);
    let viseme: Viseme = punctuation ? "REST" : "AH";
    if (!punctuation) {
      const hit = charMap.find(([rx]) => rx.test(token));
      if (hit) viseme = hit[1];
    }
    return {
      start: index * unit,
      end: (index + 1) * unit,
      viseme,
      weight: punctuation ? 0.2 : 1
    };
  });
}
