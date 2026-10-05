import React from 'react';

interface AudioWaveformProps {
  isSpeaking: boolean;
  frequencyData?: Uint8Array;
  color?: string;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isSpeaking,
  frequencyData,
  color = 'bg-cyan-400',
  barCount = 18,
}) => {
  const bars = Array.from({ length: barCount }, (_, i) => {
    let heightPercent = 12;

    if (isSpeaking) {
      if (frequencyData && frequencyData.length > 0) {
        // Map frequencyData indices
        const dataIndex = Math.floor((i / barCount) * (frequencyData.length / 2));
        const val = frequencyData[dataIndex] || 0;
        heightPercent = Math.max(14, Math.min(100, Math.round((val / 255) * 100)));
      } else {
        // Animated dynamic wave
        const offset = (i * 0.4) % Math.PI;
        heightPercent = Math.max(20, Math.floor(Math.sin(Date.now() / 150 + offset) * 40 + 55));
      }
    }

    return (
      <div
        key={i}
        className={`w-1 rounded-full transition-all duration-75 ${
          isSpeaking ? color : 'bg-slate-700/50'
        }`}
        style={{
          height: `${heightPercent}%`,
          opacity: isSpeaking ? 0.9 : 0.4,
        }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2 bg-slate-950/60 rounded-md border border-slate-800/80">
      {bars}
    </div>
  );
};
