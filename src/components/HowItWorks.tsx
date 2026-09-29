import React from 'react';

const STEPS = [
  {
    num: '1',
    title: 'Paste Link',
    desc: 'Copy a supported video URL and paste it into the search bar.',
  },
  {
    num: '2',
    title: 'Auto Detect',
    desc: 'Pastelink identifies the platform and probes available video streams.',
  },
  {
    num: '3',
    title: 'Choose Format',
    desc: 'Select HD 1080p, SD 720p, or pure MP3 320kbps audio.',
  },
  {
    num: '4',
    title: 'Download',
    desc: 'Click Download Now to save the video file directly to your device.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-xl mx-auto mb-14">
        <span className="text-xs font-black uppercase tracking-widest text-[#00e575] mb-2 block">
          Workflow
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight mb-3">
          How It Works
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          Four easy steps to save your favorite clips in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className="bg-white dark:bg-[#12141c] border border-zinc-200 dark:border-zinc-800 hover:border-[#00e575] rounded-3xl p-7 transition-all hover:-translate-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black text-base flex items-center justify-center mb-5">
              {s.num}
            </div>
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white mb-2">
              {s.title}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
