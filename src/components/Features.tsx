import React from 'react';
import { Zap, Check, Shield, Smartphone, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Fast Download',
    desc: 'Get your videos quickly with direct multi-threaded stream delivery.',
  },
  {
    icon: Check,
    title: 'High Quality',
    desc: '1080p Full HD, 720p SD, or pristine 320kbps MP3 audio.',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    desc: 'No account required, no deceptive popups, and no spyware redirects.',
  },
  {
    icon: Smartphone,
    title: 'All Devices',
    desc: 'Optimized for iPhone, Android, iPad, Mac, and Windows PC.',
  },
  {
    icon: Sparkles,
    title: 'Simple',
    desc: 'Paste, auto-detect platform, and download in one click.',
  },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-zinc-50 dark:bg-[#0c0e14] border-y border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#00e575] mb-2 block">
            Key Advantages
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight mb-3">
            Engineered for Effortless Downloading
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Reliable media extraction without spam, redirects or complicated software.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white dark:bg-[#12141c] border border-zinc-200 dark:border-zinc-800 hover:border-[#00e575] rounded-2xl p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#00e575]/10 text-[#00e575] flex items-center justify-center mx-auto mb-4 font-black">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
