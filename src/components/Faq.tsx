import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Which platforms are supported?',
    a: 'Pastelink supports TikTok videos and clips without watermarks, Instagram Reels and posts, Facebook Watch and feed videos, YouTube videos and Shorts, Twitter/X, and direct media URLs.',
  },
  {
    q: 'How does automatic detection work?',
    a: "When you paste a link into the input box, Pastelink's parser evaluates the domain and URL pattern in real-time, displaying the platform badge automatically without manual selection.",
  },
  {
    q: 'What quality options are available?',
    a: 'We provide HD (1080p), SD (720p), and Audio Only (MP3 320kbps) formats based on the highest quality supported by the original upload.',
  },
  {
    q: 'Does Pastelink store my links?',
    a: 'No. Pastelink does not store your URLs, search queries, or personal history. Link evaluation is processed ephemerally on-the-fly.',
  },
  {
    q: 'How does downloading work?',
    a: 'Upon clicking "Download Now", a request is sent to the backend with the video link and quality format. The server returns a direct downloadable media link, which triggers your browser download.',
  },
];

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-zinc-50 dark:bg-[#0c0e14] border-t border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#00e575] mb-2 block">
            Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Everything you need to know about Pastelink.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="bg-white dark:bg-[#12141c] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-extrabold text-base text-zinc-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform ${
                      isOpen ? 'rotate-180 text-[#00e575]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60 leading-relaxed">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
