// Phoneme-to-Viseme (visual mouth shape) mapping for realistic lip-sync
// Visemes represent the visual equivalent of phonemes

export interface VisemeFrame {
  jaw: number;     // 0 (closed) to 1 (wide open)
  width: number;   // -0.5 (pinched/rounded) to 0.5 (spread)
  round: number;   // 0 (flat lips) to 1 (rounded)
}

// Comprehensive phoneme → viseme mapping
export const VISEME_MAP: Record<string, VisemeFrame> = {
  // Open Vowels (wide mouth opening)
  'aa': { jaw: 0.75, width: 0.25, round: 0.0 },    // "father", "bra" - wide open
  'ah': { jaw: 0.70, width: 0.20, round: 0.0 },    // "lot", "father variation"
  'ao': { jaw: 0.65, width: 0.05, round: 0.35 },   // "bought", "thought" - slight rounding
  'aw': { jaw: 0.50, width: -0.05, round: 0.25 },  // "mouth", "now" - rounded diphthong

  // Mid Vowels
  'ae': { jaw: 0.50, width: 0.15, round: 0.0 },    // "cat", "trap" - medium open
  'eh': { jaw: 0.35, width: 0.10, round: 0.0 },    // "dress", "pet" - half open
  'er': { jaw: 0.30, width: 0.00, round: 0.15 },   // "bird", "fur" - neutral, slight round

  // Close Vowels (minimal jaw opening)
  'ih': { jaw: 0.25, width: 0.15, round: 0.0 },    // "kit", "bit" - spread lips
  'iy': { jaw: 0.20, width: 0.20, round: 0.0 },    // "fleece", "beat" - more spread
  'oh': { jaw: 0.45, width: -0.15, round: 0.50 },  // "goat", "go" - rounded
  'uh': { jaw: 0.30, width: -0.10, round: 0.40 },  // "foot", "book" - back vowel
  'uw': { jaw: 0.35, width: -0.25, round: 0.70 },  // "goose", "boot" - very rounded

  // Diphthongs (moving vowels)
  'ay': { jaw: 0.55, width: 0.20, round: 0.0 },    // "face", "day" - starts open
  'ey': { jaw: 0.40, width: 0.15, round: 0.0 },    // "goose", "bay" - mid open
  'oy': { jaw: 0.50, width: -0.10, round: 0.40 },  // "choice", "boy" - rounded

  // Bilabial Consonants (lips together/near)
  'p': { jaw: 0.05, width: -0.35, round: 0.20 },   // "pop" - closed lips
  'b': { jaw: 0.10, width: -0.30, round: 0.15 },   // "bob" - lips together
  'm': { jaw: 0.05, width: -0.35, round: 0.20 },   // "mom" - lips pressed together
  'w': { jaw: 0.25, width: -0.25, round: 0.60 },   // "wet" - rounded lips, slightly open

  // Labiodental (lower lip against teeth)
  'f': { jaw: 0.12, width: 0.10, round: 0.0 },     // "fun" - lower lip bites upper teeth
  'v': { jaw: 0.15, width: 0.15, round: 0.0 },     // "van" - similar to 'f' but voiced

  // Alveolar Consonants (tongue up, jaw slightly open)
  't': { jaw: 0.15, width: 0.05, round: 0.0 },     // "top" - tongue behind teeth
  'd': { jaw: 0.18, width: 0.05, round: 0.0 },     // "dog" - similar to 't'
  'n': { jaw: 0.20, width: 0.00, round: 0.0 },     // "net" - tongue up, lips apart
  's': { jaw: 0.15, width: 0.10, round: 0.0 },     // "sit" - teeth close, slight opening
  'z': { jaw: 0.18, width: 0.12, round: 0.0 },     // "zoo" - similar to 's'
  'l': { jaw: 0.25, width: 0.08, round: 0.0 },     // "lot" - tongue up, lips open

  // Postalveolar Consonants
  'sh': { jaw: 0.18, width: 0.05, round: 0.10 },   // "shoe" - slight rounding, compressed
  'zh': { jaw: 0.20, width: 0.08, round: 0.08 },   // "measure" - voiced version
  'ch': { jaw: 0.15, width: 0.05, round: 0.08 },   // "church" - similar to 'sh'
  'jh': { jaw: 0.18, width: 0.05, round: 0.08 },   // "judge" - voiced version
  'r':  { jaw: 0.30, width: -0.08, round: 0.40 },  // "red" - rounded lips, jaw open

  // Velar Consonants (back of throat, minimal visible movement)
  'g': { jaw: 0.12, width: 0.00, round: 0.0 },     // "go" - neutral
  'k': { jaw: 0.10, width: 0.00, round: 0.0 },     // "kite" - neutral
  'ng': { jaw: 0.08, width: 0.00, round: 0.0 },    // "sing" - minimal movement

  // Theta Consonants (tongue between teeth)
  'th': { jaw: 0.25, width: 0.05, round: 0.0 },    // "think" - tongue slightly visible
  'dh': { jaw: 0.28, width: 0.08, round: 0.0 },    // "this" - voiced version

  // Palatal Consonants
  'y': { jaw: 0.22, width: 0.10, round: 0.0 },     // "yes" - spread lips

  // Default fallback
  '': { jaw: 0.08, width: 0.00, round: 0.0 },      // Neutral/rest position
};

/**
 * Analyze frequency data and estimate appropriate viseme
 * Used when real-time text transcription is unavailable
 */
export function estimateVisemeFromFrequency(frequencyData: Uint8Array): VisemeFrame {
  if (!frequencyData || frequencyData.length === 0) {
    return VISEME_MAP[''];
  }

  // Frequency bands (Hz approximation)
  const bass = frequencyData.slice(0, 4).reduce((a, b) => a + b) / 4;       // 0-500 Hz
  const lowMid = frequencyData.slice(4, 8).reduce((a, b) => a + b) / 4;     // 500-1000 Hz
  const mid = frequencyData.slice(8, 16).reduce((a, b) => a + b) / 8;       // 1000-2000 Hz
  const highMid = frequencyData.slice(16, 24).reduce((a, b) => a + b) / 8;  // 2000-3000 Hz
  const high = frequencyData.slice(24, 32).reduce((a, b) => a + b) / 8;     // 3000+ Hz

  const avgFreq = (bass + lowMid + mid + highMid + high) / 5;

  // Classify sound type based on frequency distribution
  // Vowels: strong mid-frequency energy
  // Consonants: strong highs or specific patterns

  const isVoiced = lowMid > 80 || bass > 100;

  if (isVoiced && highMid < 120) {
    // Likely a low/back vowel (ah, oh, uh, oo)
    const openness = Math.min(1, (mid / 200) * 1.2);
    const rounding = lowMid > 120 ? 0.4 : 0.1;
    return {
      jaw: 0.4 + openness * 0.35,
      width: rounding > 0.3 ? -0.15 : 0.15,
      round: rounding,
    };
  } else if (mid > 120 && high < 100) {
    // Likely a front vowel (eh, ih, ay)
    return {
      jaw: 0.3 + (mid / 255) * 0.3,
      width: 0.15,
      round: 0.0,
    };
  } else if (high > 150) {
    // Sibilants (s, sh, z, etc.)
    return {
      jaw: 0.15,
      width: 0.08 + (high / 255) * 0.08,
      round: 0.0,
    };
  } else if (lowMid > 150 && high < 80) {
    // Nasals (m, n, ng)
    return {
      jaw: 0.1,
      width: -0.25,
      round: 0.15,
    };
  } else if (bass < 60) {
    // Weak sound, likely a consonant
    return VISEME_MAP[''];
  }

  // Default estimate
  return {
    jaw: Math.min(1, Math.max(0.05, (avgFreq / 255) * 0.7)),
    width: Math.max(-0.3, Math.min(0.3, (mid - bass) / 150)),
    round: highMid > 100 ? 0.2 : 0.0,
  };
}

/**
 * Smooth interpolation between viseme frames
 * Creates natural transitions between mouth shapes
 */
export function interpolateVisemes(
  current: VisemeFrame,
  target: VisemeFrame,
  progress: number // 0 to 1
): VisemeFrame {
  const p = Math.min(1, Math.max(0, progress));
  return {
    jaw: current.jaw + (target.jaw - current.jaw) * p,
    width: current.width + (target.width - current.width) * p,
    round: current.round + (target.round - current.round) * p,
  };
}

/**
 * Natural blinking pattern generator
 * Returns blink value (0 = fully closed, 1 = fully open)
 */
export function generateBlinkPattern(timeMs: number): number {
  const blinkDuration = 150; // milliseconds
  const blinkInterval = 4000; // milliseconds between blinks
  const timeInCycle = timeMs % blinkInterval;

  if (timeInCycle < blinkDuration) {
    // Currently blinking
    const blinkProgress = timeInCycle / blinkDuration;
    // Sinusoidal blink curve (smooth close and open)
    return Math.cos(blinkProgress * Math.PI) * 0.5 + 0.5;
  }

  return 1; // Eyes open
}

/**
 * Subtle head tilt based on emotion/speech pattern
 */
export function generateHeadMovement(
  timeMs: number,
  speechIntensity: number = 0.5 // 0-1
): { tilt: number; nod: number } {
  const naturalBobbing = Math.sin(timeMs / 400) * speechIntensity * 2;
  const occasionalNod = Math.sin(timeMs / 3000) * 1.5;

  return {
    tilt: naturalBobbing,
    nod: occasionalNod,
  };
}

