import React, { useState } from 'react';
import { Link2, Clipboard, X, ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { isValidMediaUrl, detectPlatform } from '../utils/security';

interface HeroSearchProps {
  url: string;
  setUrl: (val: string) => void;
  onFetch: (targetUrl?: string) => void;
  onLoadDemo: (preset: 'nature' | 'tiktok') => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

const SAMPLE_PLATFORMS = [
  { name: 'YouTube', sampleUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  { name: 'TikTok', sampleUrl: 'https://www.tiktok.com/@creativestudio/video/733918239102839' },
  { name: 'Twitter / X', sampleUrl: 'https://x.com/OpenAI/status/1758192957386342635' },
  { name: 'Instagram', sampleUrl: 'https://www.instagram.com/reel/C8q_4Uau8-R/' },
  { name: 'Vimeo', sampleUrl: 'https://vimeo.com/76979871' },
  { name: 'Reddit', sampleUrl: 'https://www.reddit.com/r/NatureIsFuckingLit/comments/1chd7yv/' },
  { name: 'Archive.org', sampleUrl: 'https://archive.org/details/BigBuckBunny_124' },
];

export const HeroSearch: React.FC<HeroSearchProps> = ({
  url,
  setUrl,
  onFetch,
  onLoadDemo,
  isLoading,
  errorMessage,
}) => {
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
          setPasteNotice('Pasted from clipboard!');
          setTimeout(() => setPasteNotice(null), 2000);
        } else {
          setPasteNotice('Clipboard is empty.');
          setTimeout(() => setPasteNotice(null), 2000);
        }
      } else {
        setPasteNotice('Clipboard permission unavailable. Use Ctrl+V.');
        setTimeout(() => setPasteNotice(null), 2500);
      }
    } catch {
      setPasteNotice('Could not access clipboard. Paste manually.');
      setTimeout(() => setPasteNotice(null), 2500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onFetch();
  };

  const detected = url.trim() ? detectPlatform(url) : null;
  const validation = url.trim() ? isValidMediaUrl(url) : null;

  return (
    <section id="downloader" className="relative pt-12 pb-16 lg:pt-20 lg:pb-24">
      {/* Background glow accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[340px] w-[580px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="h-[280px] w-[420px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Kicker */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>yt-dlp Engine & FFmpeg 4K Muxing</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
          Paste Link Video & Audio Downloader
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg text-balance">
          Fetch high-resolution video streams in 4K, 1080p, and 720p or extract pure 320kbps MP3 audio with instant client-side conversion and zero watermark mode.
        </p>

        {/* Input Box Card */}
        <div className="mx-auto mt-8 max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="group relative flex flex-col gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 sm:flex-row sm:items-center sm:gap-3 sm:p-2.5"
          >
            {/* Input icon */}
            <div className="hidden pl-3 text-slate-400 sm:block">
              <Link2 className="h-5 w-5" />
            </div>

            {/* URL Input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL (YouTube, TikTok, Twitter/X, Instagram, Vimeo, Reddit...)"
              className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-slate-500 focus:outline-none sm:text-base"
              aria-label="Video or media URL"
            />

            {/* Clear button */}
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                title="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Auto Paste Button */}
            <button
              type="button"
              onClick={handlePaste}
              className="relative hidden items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white sm:flex whitespace-nowrap"
              title="Paste from clipboard"
            >
              <Clipboard className="h-3.5 w-3.5 text-indigo-400" />
              <span>Paste</span>
            </button>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <span>Fetch Media</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Paste toast notification */}
          {pasteNotice && (
            <div className="mt-2 text-xs font-medium text-indigo-400 transition-opacity">
              {pasteNotice}
            </div>
          )}

          {/* Validation warning */}
          {validation && !validation.valid && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{validation.error}</span>
            </div>
          )}

          {/* Platform detected indicator */}
          {detected && validation?.valid && (
            <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>Detected source:</span>
              <span className={`font-semibold ${detected.accentColor}`}>{detected.name}</span>
            </div>
          )}

          {/* Error Message banner */}
          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-left text-sm text-red-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Extraction Notice</p>
                  <p className="mt-0.5 text-xs text-red-300/90 leading-relaxed">{errorMessage}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                    <span className="text-slate-400">Try testing with verified demo clips:</span>
                    <button
                      type="button"
                      onClick={() => onLoadDemo('nature')}
                      className="font-medium text-indigo-300 underline hover:text-white"
                    >
                      4K Blender Sample
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => onLoadDemo('tiktok')}
                      className="font-medium text-cyan-300 underline hover:text-white"
                    >
                      TikTok No-Watermark Clip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* One-Click Demo Clips & Quick Links */}
          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Instant Test Demos:</span>
              <button
                type="button"
                onClick={() => onLoadDemo('nature')}
                className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 transition-colors hover:border-slate-700 hover:text-white font-medium"
              >
                4K Cinema Sample
              </button>
              <button
                type="button"
                onClick={() => onLoadDemo('tiktok')}
                className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 transition-colors hover:border-slate-700 hover:text-white font-medium"
              >
                TikTok Reel Sample
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-slate-500">
              <span>Quick sample:</span>
              {SAMPLE_PLATFORMS.slice(0, 4).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setUrl(p.sampleUrl);
                  }}
                  className="hover:text-slate-300 transition-colors underline decoration-slate-700 underline-offset-2"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
