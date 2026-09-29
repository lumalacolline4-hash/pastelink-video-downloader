import React from 'react';
import { History, X, Trash2, ExternalLink, Copy, Check, Film, Music } from 'lucide-react';
import { HistoryItem } from '../types/media';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onSelectUrl: (url: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onRemoveItem,
  onSelectUrl,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Recent Downloads</h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-red-400 hover:text-red-300 transition-colors p-1"
                title="Clear all download history"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Close history drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-slate-500">
              <History className="h-10 w-10 text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-400">No download history yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Links you process and save will be recorded locally for rapid re-downloading.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 transition-all hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="flex gap-3">
                  {/* Thumbnail / Icon */}
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-500">
                        {item.formatType === 'audio' ? (
                          <Music className="h-5 w-5" />
                        ) : (
                          <Film className="h-5 w-5" />
                        )}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 font-mono text-[9px] font-bold text-white uppercase">
                      {item.format}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate line-clamp-1">
                      {item.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="capitalize">{item.extractor}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-indigo-400">{item.resolutionOrBitrate}</span>
                      {item.fileSizeFormatted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{item.fileSizeFormatted}</span>
                        </>
                      )}
                    </div>
                    <span className="mt-1 block text-[10px] text-slate-500 font-mono">
                      {new Date(item.downloadedAt).toLocaleDateString()} at{' '}
                      {new Date(item.downloadedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectUrl(item.url);
                        onClose();
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Process Again
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      onClick={() => handleCopy(item.id, item.url)}
                      className="text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Remove from history"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Notice */}
        <div className="mt-4 border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
          History is preserved in local browser storage only.
        </div>
      </div>
    </div>
  );
};
