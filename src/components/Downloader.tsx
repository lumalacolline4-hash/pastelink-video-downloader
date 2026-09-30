import React, { useState, useEffect } from 'react';
import { Link, Clipboard, ArrowDown, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { detectPlatform } from '../utils/detector';

interface DownloaderProps {
  onFetchVideo: (url: string) => void;
  isLoading: boolean;
  serverError: string | null;
}

const SAMPLE_LINKS = [
  { label: 'Sample MP4 Video', url: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4' },
  { label: 'YouTube Video', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  { label: 'TikTok Video', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678' },
  { label: 'Direct Media', url: 'https://filesamples.com/samples/video/mp4/sample_960x400_ocean_with_audio.mp4' },
];

export const Downloader: React.FC<DownloaderProps> = ({
  onFetchVideo,
  isLoading,
  serverError,
}) => {
  const [url, setUrl] = useState('');
  const [detected, setDetected] = useState<string>('unknown');

  useEffect(() => {
    if (url.trim()) {
      setDetected(detectPlatform(url));
    } else {
      setDetected('unknown');
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onFetchVideo(url.trim());
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
          onFetchVideo(text.trim());
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 my-6">
      <div className="bg-white dark:bg-[#12141c] border-2 border-[#00e575] rounded-3xl p-6 sm:p-9 shadow-[0_0_35px_rgba(0,229,117,0.22)] transition-all">
        {/* Top Detection & Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs font-black tracking-wider text-[#00e575] uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Detect</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tiktok', label: 'TikTok' },
              { id: 'instagram', label: 'Instagram' },
              { id: 'facebook', label: 'Facebook' },
              { id: 'youtube', label: 'YouTube' },
            ].map((p) => {
              const isActive = detected.toLowerCase() === p.id;
              return (
                <span
                  key={p.id}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#00e575]/20 border border-[#00e575] text-[#00e575] shadow-[0_0_10px_rgba(0,229,117,0.3)]'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-500'
                  }`}
                >
                  {p.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center">
            <Link className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste TikTok, Instagram, Facebook, Youtube link here..."
              className="w-full h-14 pl-12 pr-24 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-900 dark:text-white placeholder-zinc-400 text-sm sm:text-base font-medium focus:outline-none focus:border-[#00e575] focus:ring-4 focus:ring-[#00e575]/15 transition-all"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-3 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-[#00e575] transition-colors flex items-center gap-1"
            >
              <Clipboard className="w-3.5 h-3.5 text-[#00e575]" />
              <span>Paste</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-14 px-8 rounded-2xl bg-[#00e575] text-zinc-950 font-black text-base flex items-center justify-center gap-2 hover:bg-[#00cf68] hover:shadow-[0_8px_25px_rgba(0,229,117,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-5 h-5 stroke-[3]" />
                <span>Get Video</span>
              </>
            )}
          </button>
        </form>

        {/* Status / Feedback */}
        <div className="mt-4 text-xs font-semibold min-h-[20px]">
          {serverError ? (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          ) : detected !== 'unknown' ? (
            <span className="text-[#00e575]">
              ✓ Detected source: <strong>{detected.toUpperCase()}</strong>
            </span>
          ) : url.trim() ? (
            <span className="text-zinc-500">
              Enter a public TikTok, Instagram, Facebook, or YouTube video link.
            </span>
          ) : (
            <span className="text-zinc-400">
              Paste a supported link above to automatically analyze format.
            </span>
          )}
        </div>

        {/* Quick Sample Links */}
        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 font-bold">Try Samples:</span>
          {SAMPLE_LINKS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setUrl(sample.url);
                onFetchVideo(sample.url);
              }}
              className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-[#00e575] hover:text-[#00e575] font-semibold transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
