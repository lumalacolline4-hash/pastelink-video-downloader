import React, { useEffect, useRef } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Gauge,
  Clock,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { DownloadProgress } from '../types/media';

interface ProgressModalProps {
  progress: DownloadProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  progress,
  isOpen,
  onClose,
  onRetry,
}) => {
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    if (progress?.status === 'ready' && progress.downloadUrl && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      // Auto trigger browser download
      const a = document.createElement('a');
      a.href = progress.downloadUrl;
      a.download = progress.fileName || 'downloaded-media';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    if (progress?.status !== 'ready') {
      autoTriggeredRef.current = false;
    }
  }, [progress]);

  if (!isOpen || !progress) return null;

  const isComplete = progress.status === 'ready';
  const isError = progress.status === 'error';
  const isProcessing = progress.status === 'processing';
  const isDownloading = progress.status === 'downloading';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-black/80 backdrop-blur-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isError
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : isError ? (
              <AlertCircle className="h-6 w-6" />
            ) : (
              <Download className="h-5 w-5 animate-bounce" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              {isComplete
                ? 'Processing Complete!'
                : isError
                ? 'Media Pipeline Notice'
                : isProcessing
                ? 'Muxing Streams with FFmpeg...'
                : 'Downloading Media Stream...'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Task ID: {progress.taskId.slice(0, 16)}
            </p>
          </div>
        </div>

        {/* Multi-Stage Stepper */}
        <div className="mt-6 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                isDownloading || isProcessing || isComplete
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </span>
            <span className={isDownloading ? 'text-indigo-400 font-semibold' : ''}>Fetch Stream</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                isProcessing || isComplete
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </span>
            <span className={isProcessing ? 'text-indigo-400 font-semibold' : ''}>FFmpeg Mux</span>
          </div>

          <div className="h-0.5 flex-1 mx-2 bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </span>
            <span className={isComplete ? 'text-emerald-400 font-semibold' : ''}>Save File</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">{progress.statusMessage}</span>
            <span className="font-mono text-indigo-400">
              {Math.min(100, Math.max(0, Math.round(progress.percentage)))}%
            </span>
          </div>

          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isComplete
                  ? 'bg-emerald-500'
                  : isError
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
              }`}
              style={{
                width: isComplete
                  ? '100%'
                  : `${Math.min(100, Math.max(5, progress.percentage))}%`,
              }}
            />
          </div>
        </div>

        {/* Live Metrics Grid */}
        {!isError && (
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Gauge className="h-3 w-3 text-indigo-400" />
                <span>Speed</span>
              </div>
              <span className="mt-1 font-mono text-xs font-bold text-white">
                {progress.speed || '-- MB/s'}
              </span>
            </div>

            <div className="flex flex-col items-center border-x border-slate-800">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3 text-cyan-400" />
                <span>ETA</span>
              </div>
              <span className="mt-1 font-mono text-xs font-bold text-white">
                {progress.eta || '--:--'}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <HardDrive className="h-3 w-3 text-emerald-400" />
                <span>Size</span>
              </div>
              <span className="mt-1 font-mono text-xs font-bold text-white truncate max-w-[100px]">
                {progress.fileSizeFormatted || progress.totalBytes || 'Calculating'}
              </span>
            </div>
          </div>
        )}

        {/* Error message detail */}
        {isError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-300">
            <p className="font-semibold text-red-200">Execution Error:</p>
            <p className="mt-1 text-red-300/90 leading-relaxed">
              {progress.error || 'The download task failed during extraction.'}
            </p>
            <p className="mt-2 text-slate-400">
              Tip: Verify that the source video is public, unblocked, or test our instant demo clips.
            </p>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          {isError ? (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Dismiss
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </button>
              )}
            </>
          ) : isComplete ? (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Close
              </button>
              {progress.downloadUrl && (
                <a
                  href={progress.downloadUrl}
                  download={progress.fileName || 'media'}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Save File to Disk</span>
                </a>
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Run in Background
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
