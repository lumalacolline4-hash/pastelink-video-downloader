import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section id="home" className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-4 text-center">
      {/* Floating Badges (Desktop) */}
      <div className="hidden lg:flex absolute top-36 -left-6 items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-zinc-200/90 shadow-lg text-left transition-all hover:scale-105">
        <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm shadow-sm">
          f
        </div>
        <div className="flex flex-col leading-tight">
          <strong className="text-xs font-black text-zinc-900">Facebook</strong>
          <small className="text-[10px] font-medium text-zinc-500">FB Watch &amp; Reels</small>
        </div>
      </div>

      <div className="hidden lg:flex absolute top-36 -right-6 items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-zinc-200/90 shadow-lg text-left transition-all hover:scale-105">
        <div className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center text-[10px] shadow-sm">
          ▶
        </div>
        <div className="flex flex-col leading-tight">
          <strong className="text-xs font-black text-zinc-900">YouTube</strong>
          <small className="text-[10px] font-medium text-zinc-500">Shorts &amp; 4K</small>
        </div>
      </div>

      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00e575]" />
        <span>Next-Gen High Speed Downloader</span>
      </div>

      {/* Primary Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 leading-[1.12] mb-4 text-balance">
        Download Videos<br />
        <span className="text-[#00e575]">
          From Your Favorite<br />
          Platforms
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto text-balance font-medium leading-relaxed">
        Paste a link from TikTok, Instagram, Facebook or YouTube. Pastelink detects the platform automatically.
      </p>
    </section>
  );
};
