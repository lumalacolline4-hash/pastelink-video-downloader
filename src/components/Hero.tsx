import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section id="home" className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-6 text-center">
      {/* Floating Badges (Desktop) */}
      <div className="hidden lg:flex absolute top-6 -left-8 items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#12141c] border border-zinc-200 dark:border-zinc-800 shadow-lg text-left animate-bounce duration-1000">
        <span className="text-xl">🎵</span>
        <div className="flex flex-col">
          <strong className="text-xs font-bold text-zinc-900 dark:text-white">TikTok</strong>
          <small className="text-[10px] text-zinc-500">Auto-detect</small>
        </div>
      </div>

      <div className="hidden lg:flex absolute top-6 -right-8 items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#12141c] border border-zinc-200 dark:border-zinc-800 shadow-lg text-left">
        <span className="text-xl">📸</span>
        <div className="flex flex-col">
          <strong className="text-xs font-bold text-zinc-900 dark:text-white">Instagram</strong>
          <small className="text-[10px] text-zinc-500">Reels & Stories</small>
        </div>
      </div>

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-6">
        <span className="w-2 h-2 rounded-full bg-[#00e575] animate-ping" />
        <span>Next-Gen Fast Downloader</span>
      </div>

      {/* Primary Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 dark:text-white leading-[1.12] mb-4 text-balance">
        Download Videos<br />
        <span className="text-[#00e575] drop-shadow-[0_0_25px_rgba(0,229,117,0.35)]">
          From Your Favorite Platforms
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto text-balance">
        Paste a link from TikTok, Instagram, Facebook or YouTube. Pastelink detects the platform automatically.
      </p>
    </section>
  );
};
