import React from 'react';
import { X, Activity, Server, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import { SystemStatus } from '../types/media';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: SystemStatus | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({
  isOpen,
  onClose,
  system,
  onRefresh,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Engine Diagnostics</h3>
            <p className="text-xs text-slate-400">Media processing cluster status</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-xs">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-400" />
              <span className="text-slate-300 font-medium">yt-dlp Engine</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">
              {system?.ytdlpVersion || 'Detecting...'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-300 font-medium">FFmpeg Binary</span>
            </div>
            <span className="font-mono text-slate-200 truncate max-w-[200px]">
              {system?.ffmpegVersion || 'Detecting...'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-400" />
              <span className="text-slate-300 font-medium">Active Background Tasks</span>
            </div>
            <span className="font-mono text-white font-bold">
              {system?.activeTasks ?? 0}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400">Node Runtime</span>
            <span className="font-mono text-slate-300">{system?.nodeVersion || process.version}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-slate-400">Uptime</span>
            <span className="font-mono text-slate-300">
              {system?.uptimeSeconds ? `${Math.floor(system.uptimeSeconds / 60)} mins` : 'Just started'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
