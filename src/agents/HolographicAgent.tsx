import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds } from "@react-three/drei";
import { agentRegistry } from "./agentRegistry";
import type { HolographicAgentProps, Viseme } from "./types";
import { useSpeechClock } from "./audio/useSpeechClock";
import { GLBFacialAvatar } from "./rig/GLBFacialAvatar";

const mouthShape: Record<Viseme, { rx: number; ry: number; y: number }> = {
  REST: { rx: 18, ry: 2.5, y: 190 },
  AA: { rx: 16, ry: 15, y: 191 },
  AE: { rx: 21, ry: 11, y: 190 },
  AH: { rx: 17, ry: 13, y: 191 },
  EE: { rx: 25, ry: 5, y: 189 },
  IH: { rx: 22, ry: 6, y: 190 },
  OH: { rx: 13, ry: 15, y: 191 },
  OU: { rx: 9, ry: 12, y: 191 },
  MBP: { rx: 20, ry: 1.5, y: 189 },
  FV: { rx: 21, ry: 4, y: 190 },
  L: { rx: 18, ry: 8, y: 190 },
  SZ: { rx: 23, ry: 4, y: 190 },
  TH: { rx: 18, ry: 7, y: 191 },
  CH: { rx: 16, ry: 8, y: 190 },
  R: { rx: 14, ry: 7, y: 190 },
  WQ: { rx: 10, ry: 9, y: 190 }
};

function ModelStage({
  modelUrl,
  viseme,
  blink,
  hologramColor
}: {
  modelUrl: string;
  viseme: Viseme;
  blink: number;
  hologramColor: string;
}) {
  return (
    <div className="glb-avatar-stage" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 3.1], fov: 32 }} dpr={[1, 1.75]}>
        <ambientLight intensity={1.35} />
        <pointLight position={[2, 2, 3]} intensity={2.2} />
        <pointLight position={[-2, 1, 2]} intensity={1.15} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.12}>
            <GLBFacialAvatar
              modelUrl={modelUrl}
              viseme={viseme}
              blink={blink}
              hologramColor={hologramColor}
            />
          </Bounds>
        </Suspense>
      </Canvas>
    </div>
  );
}

export function HolographicAgent({
  agentId,
  state,
  speech,
  audioElement,
  intensity = 1,
  onSpeechStart,
  onSpeechEnd
}: HolographicAgentProps) {
  const config = agentRegistry[agentId] ?? agentRegistry.echo;
  const modelUrl = config.modelUrl ?? "";
  const speaking = state === "SPEAKING" && Boolean(speech);
  const { viseme, progress } = useSpeechClock(speech, speaking, audioElement);
  const [blink, setBlink] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setModelReady(false);
    if (!modelUrl) return;
    fetch(modelUrl, { method: "HEAD" })
      .then((response) => {
        if (!cancelled) setModelReady(response.ok);
      })
      .catch(() => {
        if (!cancelled) setModelReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  useEffect(() => {
    if (!speaking) return;
    onSpeechStart?.();
    const ms = Math.max(100, (speech?.duration ?? 0) * 1000);
    const timer = window.setTimeout(() => onSpeechEnd?.(), ms);
    return () => window.clearTimeout(timer);
  }, [speaking, speech, onSpeechStart, onSpeechEnd]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const schedule = () => {
      const wait = 2500 + Math.random() * 4000;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        window.setTimeout(() => setBlink(false), 135);
        schedule();
      }, wait);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const mouth = mouthShape[viseme];
  const energy = speaking ? 0.75 + 0.25 * Math.sin(progress * Math.PI * 34) : 0.45;

  const statusLabel = useMemo(() => {
    if (state === "SPEAKING") return "TRANSMITTING";
    if (state === "THINKING") return "PROCESSING";
    if (state === "LISTENING") return "LISTENING";
    return state;
  }, [state]);

  return (
    <div
      className={"holo-agent state-" + state.toLowerCase() + (modelReady ? " model-ready" : "")}
      style={{ "--agent-cyan": config.hologramColor, "--energy": energy * intensity } as CSSProperties}
      aria-label={config.displayName + " holographic agent"}
    >
      <div className="holo-rings" />
      <div className="holo-scanlines" />

      {modelReady && modelUrl ? (
        <ModelStage
          modelUrl={modelUrl}
          viseme={viseme}
          blink={blink ? 1 : 0}
          hologramColor={config.hologramColor}
        />
      ) : (
        <svg className="holo-face" viewBox="0 0 300 320" role="img" aria-label={config.displayName}>
          <defs>
            <filter id="holoGlow">
              <feGaussianBlur stdDeviation="3.6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="faceFill" cx="50%" cy="34%" r="62%">
              <stop offset="0%" stopColor="#8ff4ff" stopOpacity=".33" />
              <stop offset="60%" stopColor="#00b8ef" stopOpacity=".13" />
              <stop offset="100%" stopColor="#001927" stopOpacity=".02" />
            </radialGradient>
          </defs>

          <g filter="url(#holoGlow)" className="face-group">
            <ellipse cx="150" cy="135" rx="71" ry="91" fill="url(#faceFill)" stroke="var(--agent-cyan)" strokeWidth="1.3" />
            <path d="M82 120 C88 46 211 38 219 124 C214 76 194 40 150 38 C105 41 87 78 82 120Z" fill="none" stroke="var(--agent-cyan)" strokeWidth="9" opacity=".72"/>
            <path d="M86 121 C66 102 79 62 110 51 M214 121 C234 102 221 62 190 51" fill="none" stroke="var(--agent-cyan)" strokeWidth="5" opacity=".45"/>

            <g className={blink ? "blink" : ""}>
              <path d="M108 136 Q126 126 140 137 Q124 145 108 136Z" fill="none" stroke="var(--agent-cyan)" strokeWidth="2.2"/>
              <path d="M160 137 Q176 126 193 136 Q177 145 160 137Z" fill="none" stroke="var(--agent-cyan)" strokeWidth="2.2"/>
              <circle cx="126" cy="136" r="4" fill="var(--agent-cyan)" />
              <circle cx="176" cy="136" r="4" fill="var(--agent-cyan)" />
            </g>

            <path d="M149 141 C145 153 144 162 151 166" fill="none" stroke="var(--agent-cyan)" opacity=".65" />
            <ellipse
              className="viseme-mouth"
              cx="150"
              cy={mouth.y}
              rx={mouth.rx}
              ry={mouth.ry}
              fill="rgba(0,8,16,.82)"
              stroke="var(--agent-cyan)"
              strokeWidth="2"
            />
            {(viseme === "FV" || viseme === "TH") && (
              <path d="M134 190 Q150 196 166 190" stroke="#bffaff" strokeWidth="1.8" opacity=".8" />
            )}

            <path d="M106 221 C104 252 79 271 66 304 M194 221 C198 252 222 270 234 304" fill="none" stroke="var(--agent-cyan)" strokeWidth="2" opacity=".55"/>
            <path d="M101 238 C130 258 169 258 199 238" fill="none" stroke="var(--agent-cyan)" opacity=".42"/>
          </g>
        </svg>
      )}

      <div className="holo-status">
        <span>{config.displayName.toUpperCase()}</span>
        <strong>{statusLabel}</strong>
      </div>

      <div className="projection-platform">
        <div className="pegasus-platform-mark" aria-hidden="true">♞</div>
        <div className="projection-core" />
      </div>

      {import.meta.env.DEV && (
        <div className="dev-viseme">DEV · {viseme} · {modelReady ? "GLB" : "FALLBACK"}</div>
      )}
    </div>
  );
}
