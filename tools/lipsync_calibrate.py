#!/usr/bin/env python3
"""
Pegasus Lip-Sync Calibrator

Usage:
  python tools/lipsync_calibrate.py \
    --audio echo.mp3 \
    --transcript "Echo online..." \
    --output public/calibration/echo-test.json

Requires:
  pip install -U openai-whisper
  ffmpeg available on PATH

The script uses Whisper word timestamps and converts each word window into
Pegasus-native viseme cues. It is an offline calibration tool only; it is not
used in the live conversation path.
"""

from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path
from typing import Any, Iterable

VISeme = str

PAIR_RULES: list[tuple[str, VISeme]] = [
    ("th", "TH"),
    ("ch", "CH"),
    ("sh", "CH"),
    ("ph", "FV"),
    ("oo", "OU"),
    ("ou", "OU"),
    ("ow", "OH"),
    ("ee", "EE"),
    ("ea", "EE"),
]

CHAR_RULES: list[tuple[str, VISeme]] = [
    ("mbp", "MBP"),
    ("fv", "FV"),
    ("szx", "SZ"),
    ("lr", "L"),
    ("wq", "WQ"),
    ("o", "OH"),
    ("ei", "EE"),
    ("a", "AA"),
    ("u", "OU"),
]

VOWEL_FALLBACK = "AH"
REST = "REST"


def normalize_word(word: str) -> str:
    return re.sub(r"[^a-z']", "", word.lower())


def word_to_visemes(word: str) -> list[VISeme]:
    token = normalize_word(word)
    if not token:
        return [REST]

    out: list[VISeme] = []
    i = 0
    while i < len(token):
        pair = token[i : i + 2]
        matched = False
        for pattern, viseme in PAIR_RULES:
            if pair == pattern:
                out.append(viseme)
                i += 2
                matched = True
                break
        if matched:
            continue

        ch = token[i]
        viseme = None
        for chars, candidate in CHAR_RULES:
            if ch in chars:
                viseme = candidate
                break
        if viseme is None:
            viseme = VOWEL_FALLBACK
        out.append(viseme)
        i += 1

    # Collapse repeated shapes so long words do not chatter.
    collapsed: list[VISeme] = []
    for item in out:
        if not collapsed or collapsed[-1] != item:
            collapsed.append(item)
    return collapsed or [VOWEL_FALLBACK]


def flatten_words(result: dict[str, Any]) -> list[dict[str, Any]]:
    words: list[dict[str, Any]] = []
    for segment in result.get("segments", []):
        for word in segment.get("words", []) or []:
            text = str(word.get("word", "")).strip()
            if not text:
                continue
            words.append(
                {
                    "word": text,
                    "start": float(word.get("start", 0.0)),
                    "end": float(word.get("end", 0.0)),
                    "probability": float(word.get("probability", 1.0)),
                }
            )
    return words


def append_rest(cues: list[dict[str, Any]], start: float, end: float) -> None:
    if end - start < 0.025:
        return
    cues.append(
        {
            "start": round(start, 3),
            "end": round(end, 3),
            "viseme": REST,
            "weight": 0.25,
        }
    )


def build_cues(
    words: Iterable[dict[str, Any]],
    *,
    lead_ms: float,
    tail_ms: float,
    min_cue_ms: float,
) -> list[dict[str, Any]]:
    cues: list[dict[str, Any]] = []
    previous_end = 0.0
    lead = lead_ms / 1000.0
    tail = tail_ms / 1000.0
    min_cue = min_cue_ms / 1000.0

    for word in words:
        raw_start = max(previous_end, max(0.0, float(word["start"]) - lead))
        raw_end = max(raw_start + min_cue, float(word["end"]) + tail)

        if raw_start > previous_end:
            append_rest(cues, previous_end, raw_start)

        visemes = word_to_visemes(str(word["word"]))
        duration = max(min_cue * len(visemes), raw_end - raw_start)
        slot = duration / max(1, len(visemes))

        cursor = raw_start
        for idx, viseme in enumerate(visemes):
            end = raw_end if idx == len(visemes) - 1 else min(raw_end, cursor + slot)
            if end - cursor < min_cue:
                end = cursor + min_cue
            cues.append(
                {
                    "start": round(cursor, 3),
                    "end": round(end, 3),
                    "viseme": viseme,
                    "weight": 1.0,
                }
            )
            cursor = end

        previous_end = max(previous_end, cursor)

    return cues


def audio_duration_from_words(words: list[dict[str, Any]]) -> float:
    if not words:
        return 0.0
    return max(float(w["end"]) for w in words)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create Pegasus lip-sync calibration JSON.")
    parser.add_argument("--audio", required=True, help="MP3/WAV/M4A file to analyze.")
    parser.add_argument("--transcript", default="", help="Expected transcript; used as Whisper prompt.")
    parser.add_argument("--output", required=True, help="Destination JSON file.")
    parser.add_argument("--model", default="base.en", help="Whisper model name. Default: base.en")
    parser.add_argument("--language", default="en")
    parser.add_argument("--device", default=None, help="Whisper device, e.g. cpu or cuda.")
    parser.add_argument("--lead-ms", type=float, default=70.0, help="Start mouth motion before detected word.")
    parser.add_argument("--tail-ms", type=float, default=35.0, help="Hold mouth motion after detected word.")
    parser.add_argument("--min-cue-ms", type=float, default=45.0)
    args = parser.parse_args()

    try:
        import whisper  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "openai-whisper is not installed. Run: pip install -U openai-whisper"
        ) from exc

    audio_path = Path(args.audio)
    if not audio_path.exists():
        raise SystemExit(f"Audio file not found: {audio_path}")

    kwargs: dict[str, Any] = {}
    if args.device:
        kwargs["device"] = args.device

    model = whisper.load_model(args.model, **kwargs)
    result = model.transcribe(
        str(audio_path),
        language=args.language,
        task="transcribe",
        word_timestamps=True,
        verbose=False,
        initial_prompt=args.transcript or None,
        condition_on_previous_text=False,
    )

    words = flatten_words(result)
    if not words:
        raise SystemExit("Whisper returned no word timestamps.")

    cues = build_cues(
        words,
        lead_ms=args.lead_ms,
        tail_ms=args.tail_ms,
        min_cue_ms=args.min_cue_ms,
    )

    word_duration = audio_duration_from_words(words)
    duration = max(word_duration, float(cues[-1]["end"]) if cues else 0.0)
    append_rest(cues, cues[-1]["end"] if cues else 0.0, duration)

    profile = {
        "version": 1,
        "kind": "pegasus-lipsync-calibration",
        "audioFile": audio_path.name,
        "transcript": str(result.get("text", "")).strip(),
        "duration": round(duration, 3),
        "visemes": cues,
        "words": words,
        "calibration": {
            "leadMs": args.lead_ms,
            "tailMs": args.tail_ms,
            "minCueMs": args.min_cue_ms,
            "source": "openai-whisper-word-timestamps",
            "whisperModel": args.model,
        },
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(profile, indent=2), encoding="utf-8")

    print(f"Wrote {output_path}")
    print(f"Words: {len(words)}")
    print(f"Viseme cues: {len(cues)}")
    print(f"Duration: {duration:.3f}s")


if __name__ == "__main__":
    main()
