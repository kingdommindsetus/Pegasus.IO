import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic2, Send, Volume2, X } from "lucide-react";
import { HolographicAgent } from "./agents/HolographicAgent";
import type { AgentState, SpeechResult } from "./agents/types";
import { estimateVisemesFromText } from "./agents/rig/visemes";
import { agentExecutionChain, agentRegistry } from "./agents/agentRegistry";

const greeting =
  "Greetings, Kimberly. Echo online. Sales Outreach is ready. What directive should we execute?";

export function ExecutiveChamber() {
  const [state, setState] = useState<AgentState>("IDLE");
  const [activeAgentId, setActiveAgentId] = useState("echo");
  const activeAgent = agentRegistry[activeAgentId] ?? agentRegistry.echo;
  const [input, setInput] = useState("");
  const [message, setMessage] = useState(greeting);
  const [speech, setSpeech] = useState<SpeechResult | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const prompts = useMemo(
    () => [
      "Draft follow-up for Dr. Smith",
      "Analyze lead readiness score",
      "Explain In-Office Activation offer"
    ],
    []
  );

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSpeech(null);
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const speak = useCallback(async (text: string) => {
    stopAudio();

    const response = await fetch("/api/agent/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, agentId: activeAgentId })
    });

    if (!response.ok) throw new Error("Voice request failed.");
    const data = await response.json();

    if (data.fallbackToWebSpeech || !data.audioUrl) {
      if (!("speechSynthesis" in window)) throw new Error("Browser speech is unavailable.");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeAgentId === "simon" || activeAgentId === "alice" ? "en-GB" : "en-US";
      setSpeech({ transcript: text, duration: Math.max(2, text.split(/\\s+/).length / 2.6), visemes: [], provider: "BROWSER_SPEECH", audioUrl: "" });
      setState("SPEAKING");
      await new Promise<void>((resolve) => {
        utterance.onend = () => { setState("IDLE"); setSpeech(null); resolve(); };
        utterance.onerror = () => { setState("ERROR"); setSpeech(null); resolve(); };
        window.speechSynthesis.speak(utterance);
      });
      return;
    }

    const url = String(data.audioUrl);
    const audio = new Audio(url);
    audio.preload = "auto";
    audioRef.current = audio;

    const duration = await new Promise<number>((resolve, reject) => {
      const fallback = Math.max(2, text.split(/\s+/).length / 2.6);
      audio.onloadedmetadata = () => {
        resolve(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallback);
      };
      audio.onerror = () => reject(new Error("Audio could not be loaded."));
      audio.load();
    });

    setSpeech({
      transcript: text,
      duration,
      visemes: estimateVisemesFromText(text, duration),
      provider: "ELEVENLABS",
      audioUrl: url
    });
    setState("SPEAKING");

    audio.onended = () => {
      setState("IDLE");
      setSpeech(null);
      if (objectUrlRef.current === url) {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
      }
      audioRef.current = null;
    };

    audio.onerror = () => {
      setState("ERROR");
      setSpeech(null);
    };

    await audio.play();
  }, [activeAgentId, stopAudio]);

  const askAgent = useCallback(async (directive: string) => {
    const text = directive.trim();
    if (!text) return;

    stopAudio();
    setInput("");
    setState("THINKING");
    setMessage(`${activeAgent.displayName} is processing your directive…`);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          agentId: activeAgentId,
          agentName: activeAgent.displayName,
          role: activeAgent.role
        })
      });

      const data = await response.json();
      if (!response.ok || !data?.text) throw new Error(data?.error || "LLM request failed.");

      const reply = String(data.text).trim();
      setMessage(reply);
      await speak(reply);
    } catch (error) {
      console.error(error);
      setState("ERROR");
      setSpeech(null);
      setMessage(
        "Pegasus could not complete that response. The LLM or voice service needs attention."
      );
    }
  }, [activeAgent, activeAgentId, speak, stopAudio]);

  const transmit = useCallback(() => {
    void askAgent(input);
  }, [askAgent, input]);

  const switchAgent = useCallback((id: string) => {
    stopAudio();
    const agent = agentRegistry[id] ?? agentRegistry.echo;
    setState("IDLE");
    setActiveAgentId(id);
    setMessage(`${agent.displayName} online. ${agent.role} office ready for directive.`);
  }, [stopAudio]);

  return (
    <main className="chamber-shell">
      <header className="chamber-header">
        <div>
          <div className="kicker">PEGASUS EXECUTIVE CHAMBER</div>
          <div className="agent-title">
            <span>{activeAgent.displayName}</span>
            <small>// {activeAgent.role.toUpperCase()}</small>
          </div>
        </div>
        <div className="header-actions">
          <button className="voice-chip" onClick={() => void speak(message)} disabled={state === "THINKING"}>
            <Volume2 size={16} /> Natural Voice Synced
          </button>
          <button className="close-chip" aria-label="Close chamber"><X size={20} /></button>
        </div>
      </header>

      <nav className="agent-chain" aria-label="Pegasus agent execution chain">
        {agentExecutionChain.map((id,index)=>{
          const agent=agentRegistry[id];
          return <button key={id} className={id===activeAgentId?"active":""} onClick={()=>switchAgent(id)}>
            <small>{String(index+1).padStart(2,"0")}</small><strong>{agent.displayName}</strong><span>{agent.role}</span>
          </button>;
        })}
      </nav>

      <section className="chamber-grid">
        <aside className="avatar-column">
          <div className="avatar-stage">
            <HolographicAgent
              agentId={activeAgentId}
              state={state}
              speech={speech}
              audioElement={audioRef.current}
              onSpeechEnd={() => {
                if (!audioRef.current || audioRef.current.ended) setState("IDLE");
              }}
            />
          </div>

          <div className="identity-card">
            <div><span>IDENTITY:</span><strong>{activeAgent.displayName.toUpperCase()} // AGENT-{activeAgentId.toUpperCase()}</strong></div>
            <div><span>STATUS:</span><strong className="green">● ACTIVE & SYNCHRONIZED</strong></div>
            <div><span>LLM CORE:</span><strong className="cyan">GOOGLE AI STUDIO</strong></div>
            <div><span>VOICE:</span><strong className="cyan">ELEVENLABS · BROWSER FALLBACK</strong></div>
          </div>
        </aside>

        <section className="conversation-column">
          <div className="transmission-bar">
            <span className="pulse-dot" /> {state === "SPEAKING" ? `${activeAgent.displayName.toUpperCase()} IS TRANSMITTING AUDIO...` : state === "THINKING" ? `${activeAgent.displayName.toUpperCase()} IS THINKING...` : `${activeAgent.displayName.toUpperCase()} LINK STABLE`}
            <span className="live-llm">LIVE LLM</span>
          </div>

          <div className="message-area">
            <article className="agent-message">
              <div className="message-meta">
                <span>{activeAgent.displayName.toUpperCase()} // PEGASUS</span>
                <time>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
              </div>
              <p>{message}</p>
            </article>
          </div>

          <div className="prompt-row">
            <span>PROMPTS:</span>
            {prompts.map((prompt) => (
              <button key={prompt} onClick={() => void askAgent(prompt)} disabled={state === "THINKING"}>
                <Mic2 size={14} /> {prompt}
              </button>
            ))}
          </div>

          <div className="composer">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && state !== "THINKING") transmit();
              }}
              placeholder={`Communicate directive with ${activeAgent.displayName}...`}
              disabled={state === "THINKING"}
            />
            <button onClick={transmit} disabled={state === "THINKING"}><Send size={17} /> Transmit</button>
          </div>
        </section>
      </section>
    </main>
  );
}
