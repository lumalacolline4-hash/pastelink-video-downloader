import React from 'react';
import { Zap, X, Check, ShieldCheck, Film, Music } from 'lucide-react';

export interface ProgressData {
  percentage: number;
  stage: 'handshake' | 'transcoding' | 'streaming' | 'saving' | 'complete';
  stageText: string;
  speed: string;
  transferredFormatted: string;
  totalFormatted: string;
  isAudio: boolean;
  quality: string;
  onCancel: () => void;
}

export const DownloadProgressHUD: React.FC<ProgressData> = ({
  percentage,
  stage,
  stageText,
  speed,
  transferredFormatted,
  totalFormatted,
  isAudio,
  quality,
  onCancel,
}) => {
  // SVG Circular Ring Math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isComplete = percentage >= 100 || stage === 'complete';

  // 14 Equalizer Bar dynamic heights based on percentage
  const barHeights = [
    40, 75, 100, 60, 85, 45, 95, 100, 70, 85, 55, 90, 65, 40
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white border-2 border-[#00e575] p-5 sm:p-6 shadow-[0_0_35px_rgba(0,229,117,0.28)] transition-all animate-in fade-in duration-300">
      {/* Background Cyber Grid Accent */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00e575_1px,transparent_1px)] [background-size:16px_16px]"
      />

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#00e575]/20 border border-[#00e575]/50 flex items-center justify-center text-[#00e575]">
            {isAudio ? <Music className="w-4 h-4" /> : <Film className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wider uppercase text-zinc-300 flex items-center gap-1.5">
              <span>Universal Stream Engine</span>
              <span className="w-2 h-2 rounded-full bg-[#00e575] animate-ping" />
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">
              Target: {quality} ({isAudio ? 'MP3 Audio' : 'H.264 / AAC Universal MP4'})
            </span>
          </div>
        </div>

        {!isComplete ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cancel</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00e575]/20 border border-[#00e575] text-[#00e575] text-[11px] font-black">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Ready</span>
          </span>
        )}
      </div>

      {/* Main HUD Body: Circular Progress + Live Diagnostics */}
      <div className="relative z-10 py-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Left: Futuristic Circular Radial HUD (5 cols) */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 rounded-full bg-[#00e575]/10 filter blur-xl animate-pulse" />

            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#1f242d"
                strokeWidth="8"
                fill="none"
              />
              {/* Active Progress Gradient Track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#00e575"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{
                  transition: 'stroke-dashoffset 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 0 6px rgba(0, 229, 117, 0.7))',
                }}
              />
            </svg>

            {/* Center Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              {isComplete ? (
                <div className="w-12 h-12 rounded-full bg-[#00e575] text-zinc-950 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,117,0.6)] animate-in zoom-in duration-300">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
              ) : (
                <>
                  <span className="text-3xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_12px_rgba(0,229,117,0.5)]">
                    {Math.min(100, Math.max(0, percentage))}%
                  </span>
                  <span className="text-[10px] font-bold text-[#00e575] uppercase tracking-wider flex items-center gap-0.5">
                    <Zap className="w-3 h-3 animate-bounce" />
                    <span>{speed || 'Active'}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <span className="text-[11px] font-mono text-zinc-400 mt-2">
            {transferredFormatted} {totalFormatted ? `/ ${totalFormatted}` : 'transferred'}
          </span>
        </div>

        {/* Right: Live Telemetry, Waveform & Pipeline (7 cols) */}
        <div className="sm:col-span-7 flex flex-col justify-center space-y-4">
          {/* Animated Waveform Equalizer */}
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-mono">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-[#00e575]' : 'bg-[#00e575] animate-ping'}`} />
                <span>Media Data Spectrum</span>
              </span>
              <span className="text-[#00e575] font-bold">
                {isComplete ? '100% Remuxed' : 'Transmitting Packets'}
              </span>
            </div>

            {/* Equalizer Bars */}
            <div className="flex items-end justify-between h-9 px-1 gap-1">
              {barHeights.map((h, i) => {
                // Vary bar heights during streaming
                const activeHeight = isComplete
                  ? 80
                  : Math.max(20, Math.min(100, ((h * (percentage + 15)) % 100) + 15));
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-gradient-to-t from-[#00e575]/40 via-[#00e575] to-emerald-300 transition-all duration-300"
                    style={{
                      height: `${activeHeight}%`,
                      filter: 'drop-shadow(0 0 3px rgba(0, 229, 117, 0.4))',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Pipeline Stage Tracker */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <span className="text-[#00e575]">▸</span>
                <span>{stageText}</span>
              </span>
              <span className="font-mono text-[11px] text-[#00e575]">
                {percentage < 30 ? 'Stage 1/4' : percentage < 70 ? 'Stage 2/4' : percentage < 99 ? 'Stage 3/4' : 'Stage 4/4'}
              </span>
            </div>

            {/* Visual Mini Progress Bar */}
            <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-[#00e575] to-teal-300 transition-all duration-300 shadow-[0_0_10px_rgba(0,229,117,0.8)]"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-0.5">
              <span>H.264 FastStart Remux</span>
              <span>Direct Device Output</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Message */}
      <div className="relative z-10 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="text-[#00e575]">✓</span>
          <span>100% Native Storage Download (No watermark, no recompression)</span>
        </span>
        <span className="text-zinc-500 font-mono">FastStart Enabled</span>
      </div>
    </div>
  );
};
