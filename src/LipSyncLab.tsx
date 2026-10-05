import { useEffect, useMemo, useRef, useState } from "react";
import { HolographicAgent } from "./agents/HolographicAgent";
import { RigErrorBoundary } from "./RigErrorBoundary";
import type { SpeechResult } from "./agents/types";

type CalibrationProfile = SpeechResult & {
  kind?: string;
  version?: number;
  words?: Array<{ word: string; start: number; end: number; probability?: number }>;
  calibration?: Record<string, unknown>;
};

export function LipSyncLab() {
  const [profile, setProfile] = useState<CalibrationProfile | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [state, setState] = useState<"IDLE" | "SPEAKING" | "ERROR">("IDLE");
  const [status, setStatus] = useState("Load an MP3 and Pegasus calibration JSON.");
  const [showAvatar, setShowAvatar] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [currentViseme, setCurrentViseme] = useState("REST");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speech = useMemo<SpeechResult | null>(() => {
    if (!profile || !audioUrl) return null;
    return {
      transcript: profile.transcript || "",
      duration: Number(profile.duration || 0),
      visemes: profile.visemes || [],
      provider: "WHISPER_CALIBRATION",
      audioUrl,
      metadata: {
        words: profile.words || [],
        calibration: profile.calibration || {}
      }
    };
  }, [profile, audioUrl]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const audio = audioRef.current;
      const t = audio?.currentTime ?? 0;
      setPlayhead(t);
      const cue = speech?.visemes?.find((item) => t >= item.start && t < item.end);
      setCurrentViseme(cue?.viseme ?? "REST");
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      if (audioRef.current) audioRef.current.pause();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, speech]);

  async function loadJson(file: File) {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as CalibrationProfile;
      if (!Array.isArray(parsed.visemes) || !Number(parsed.duration)) {
        throw new Error("Not a Pegasus calibration profile.");
      }
      setProfile(parsed);
      setStatus(`Loaded ${parsed.visemes.length} cues · ${parsed.duration.toFixed(2)}s`);
      if (audioUrl) setShowAvatar(true);
    } catch (error) {
      console.error(error);
      setStatus("Calibration JSON could not be loaded.");
      setState("ERROR");
    }
  }

  function loadAudio(file: File) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setStatus(`Loaded audio: ${file.name}`);
    if (profile) setShowAvatar(true);
  }

  async function play() {
    if (!speech || !audioUrl) {
      setStatus("Load both audio and calibration JSON first.");
      return;
    }

    if (audioRef.current) audioRef.current.pause();

    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audio.currentTime = 0;
    audioRef.current = audio;

    audio.onplay = () => {
      setState("SPEAKING");
      setStatus("Calibration playback running…");
    };
    audio.onended = () => {
      setState("IDLE");
      setStatus("Calibration playback complete.");
    };
    audio.onerror = () => {
      setState("ERROR");
      setStatus("Audio playback failed.");
    };

    try {
      await audio.play();
    } catch (error) {
      console.error(error);
      setState("ERROR");
      setStatus("Browser blocked playback.");
    }
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState("IDLE");
    setStatus("Stopped.");
  }

  return (
    <main className="lipsync-lab">
      <section className="lab-panel">
        <div className="lab-kicker">PEGASUS DEVELOPMENT LAB</div>
        <h1>Echo Lip-Sync Calibration</h1>
        <p>
          Whisper word timestamps drive Pegasus-native viseme cues against the real
          audio clock. This tool is isolated from the Executive Chamber runtime.
        </p>

        <div className="lab-controls">
          <label>
            <span>1. Audio file</span>
            <input type="file" accept="audio/*" onChange={(e)=>e.target.files?.[0] && loadAudio(e.target.files[0])}/>
          </label>
          <label>
            <span>2. Calibration JSON</span>
            <input type="file" accept=".json,application/json" onChange={(e)=>e.target.files?.[0] && void loadJson(e.target.files[0])}/>
          </label>
        </div>

        <div className="lab-actions">
          <button onClick={()=>void play()} disabled={!speech}>Play calibrated speech</button>
          <button onClick={stop}>Stop</button>
        </div>

        <div className="lab-status">{status}</div>

        {profile && (
          <div className="lab-metrics">
            <div><span>Duration</span><strong>{Number(profile.duration).toFixed(2)}s</strong></div>
            <div><span>Viseme cues</span><strong>{profile.visemes?.length ?? 0}</strong></div>
            <div><span>Words</span><strong>{profile.words?.length ?? 0}</strong></div>
            <div><span>Lead</span><strong>{String(profile.calibration?.leadMs ?? "—")} ms</strong></div>
          </div>
        )}
      </section>

      <section className="lab-stage">
        <div className="viseme-monitor">
          <span>CURRENT VISEME</span>
          <strong>{currentViseme}</strong>
          <small>{playhead.toFixed(2)}s / {profile ? Number(profile.duration).toFixed(2) : "0.00"}s</small>
        </div>

        {showAvatar && speech ? (
          <RigErrorBoundary
            fallback={
              <div className="rig-error">
                <strong>3D rig isolated safely</strong>
                <span>Audio timing is still running. Current viseme: {currentViseme}</span>
              </div>
            }
          >
            <HolographicAgent
              agentId="echo"
              state={state}
              speech={speech}
              audioElement={audioRef.current}
            />
          </RigErrorBoundary>
        ) : (
          <div className="lab-placeholder">
            <strong>Echo calibration chamber ready</strong>
            <span>Load the MP3 and timing JSON to initialize the timing engine.</span>
          </div>
        )}
      </section>

      {profile?.transcript && (
        <section className="lab-transcript">
          <span>WHISPER TRANSCRIPT</span>
          <p>{profile.transcript}</p>
        </section>
      )}
    </main>
  );
}
