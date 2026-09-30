import React, { useState, useEffect } from 'react';
import { Link, Clipboard, ArrowDown, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { detectPlatform } from '../utils/detector';

interface DownloaderProps {
  onFetchVideo: (url: string) => void;
  isLoading: boolean;
  serverError: string | null;
}

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: '▶' },
  { id: 'tiktok', label: 'TikTok', icon: '♪' },
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'twitter', label: 'X (Twitter)', icon: '𝕏' },
  { id: 'reddit', label: 'Reddit', icon: '👾' },
];

const QUICK_TESTS = [
  { label: '▶ YouTube (Watch)', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  { label: '▶ YouTube (Shorts)', url: 'https://www.youtube.com/shorts/o7zK5Xq886U' },
  { label: '🎥 Direct Sample (Big Buck Bunny)', url: 'https://filesamples.com/samples/video/mp4/sample_960x400_ocean_with_audio.mp4' },
  { label: '♪ TikTok Video', url: 'https://www.tiktok.com/@tiktok/video/7106594312292453678' },
  { label: '📷 Instagram Reel', url: 'https://www.instagram.com/reel/C321456789/' },
  { label: 'f Facebook Watch', url: 'https://www.facebook.com/watch/?v=1234567890' },
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
      // Fallback
    }
  };

  const handleOpenNewTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {}
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 my-6">
      <div className="bg-white border-2 border-[#00e575] rounded-3xl p-6 sm:p-9 shadow-[0_0_35px_rgba(0,229,117,0.18)] transition-all">
        {/* Top Detection & Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-zinc-100">
          {/* Auto Detect Label */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#00e575] text-base font-bold">✦</span>
            <div className="flex flex-col text-[11px] font-black tracking-wider text-zinc-950 uppercase leading-none">
              <span>AUTO</span>
              <span>DETECT</span>
            </div>
          </div>

          {/* Platform Pills */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
              {PLATFORMS.map((p) => {
                const isActive = detected.toLowerCase() === p.id;
                return (
                  <span
                    key={p.id}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#00e575]/20 border border-[#00e575] text-[#00a854] shadow-sm'
                        : 'bg-zinc-100/90 border border-zinc-200/80 text-zinc-600'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </span>
                );
              })}
            </div>
            {/* Second row: Direct MP4/MP3 */}
            <div>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all inline-flex items-center gap-1 ${
                  detected === 'direct'
                    ? 'bg-[#00e575]/20 border border-[#00e575] text-[#00a854]'
                    : 'bg-zinc-100/90 border border-zinc-200/80 text-zinc-600'
                }`}
              >
                <span>🎥</span>
                <span>Direct MP4/MP3</span>
              </span>
            </div>
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
              placeholder="Paste YouTube, TikTok, Instagram, Twitter/X, Reddit, or vi"
              className="w-full h-14 pl-12 pr-24 rounded-2xl border-2 border-zinc-200 bg-zinc-50/50 text-zinc-900 placeholder-zinc-400 text-sm sm:text-base font-medium focus:outline-none focus:border-[#00e575] focus:ring-4 focus:ring-[#00e575]/15 transition-all"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-3 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-bold text-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5 text-zinc-600" />
              <span>Paste</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-14 px-8 rounded-2xl bg-[#00e575] text-zinc-950 font-black text-base flex items-center justify-center gap-2 hover:bg-[#00cf68] hover:shadow-[0_8px_25px_rgba(0,229,117,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap cursor-pointer"
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

        {/* Caption below input */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <span className="text-[#00e575]">✨</span>
          <span>Auto-detects YouTube, TikTok, Instagram, Twitter/X, Reddit, Facebook, and direct media files</span>
        </div>

        {/* Server Error Message */}
        {serverError && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Iframe Notice Banner (as shown in user's reference) */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#edf5ff] border border-[#d0e4ff] text-[#1a56db] text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-base shrink-0">💡</span>
            <p className="leading-snug text-zinc-700">
              <strong className="font-bold text-[#1a56db]">Running in AI Studio preview iframe:</strong> If your browser restricts saving directly to device storage from embedded frames, open in a full tab for 100% native downloads:
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-colors inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <span>Open in New Tab</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Test Links */}
        <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500 font-bold">Quick Test:</span>
          {QUICK_TESTS.map((test) => (
            <button
              key={test.label}
              type="button"
              onClick={() => {
                setUrl(test.url);
                onFetchVideo(test.url);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 hover:text-zinc-950 font-semibold transition-colors cursor-pointer"
            >
              {test.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
