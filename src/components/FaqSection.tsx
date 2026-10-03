import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Zap, Layers, FileAudio } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  icon?: React.ElementType;
}

const FAQS: FaqItem[] = [
  {
    question: 'How does ClipVault strip TikTok watermarks automatically?',
    icon: Zap,
    answer:
      'ClipVault leverages specialized Cobalt API and CDN extractor rules that intercept TikTok’s native content delivery network (CDN) before the animated bouncing logo and outro video frames are multiplexed. This results in the clean, original high-definition camera file.',
  },
  {
    question: 'Why do Reddit videos often download without sound elsewhere, and how does ClipVault fix it?',
    icon: Layers,
    answer:
      'Reddit hosts video (DASH adaptive video) and audio (separate AAC streams) at distinct CDN URLs. Traditional scrapers only grab the video file, leaving it muted. ClipVault uses server-side FFmpeg to download both streams in parallel and merge them losslessly into a single synchronized MP4 container.',
  },
  {
    question: 'Can I extract high-resolution 4K (2160p) and 60fps media?',
    icon: ShieldCheck,
    answer:
      'Yes. If the source platform provides 4K, 2K (1440p), or 60fps streams, ClipVault detects the adaptive stream formats, converts or muxes them using FFmpeg’s H.264/H.265 encoders, and streams the finished file directly to your browser.',
  },
  {
    question: 'How does real-time progress tracking work without WebSockets?',
    icon: Zap,
    answer:
      'ClipVault uses Server-Sent Events (SSE) via the `/api/download/progress/:taskId` endpoint. As media stream chunks transit through our backend, it tracks transfer speeds, percentages, and ETA estimates in real-time, emitting event frames with `X-Accel-Buffering: no` for zero latency.',
  },
  {
    question: 'How are Server-Side Request Forgery (SSRF) and command injections prevented?',
    icon: ShieldCheck,
    answer:
      'All incoming URLs undergo strict parsing: only http/https schemes are accepted, and private IP blocks (127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, AWS/GCP metadata 169.254.169.254) are rejected. Furthermore, all child processes are invoked with discrete parameter arrays via `child_process.spawn`, completely eliminating shell string injection vectors.',
  },
  {
    question: 'Can I extract audio in 320kbps MP3 or lossless WAV format?',
    icon: FileAudio,
    answer:
      'Yes! Choose the "Audio Only" tab to extract music tracks, voice notes, speeches, or podcasts in 320 kbps (Studio Quality), 256 kbps, or 128 kbps. FFmpeg handles resampling and metadata tagging seamlessly.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Architecture & Support</span>
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Everything you need to know about formats, watermarks, FFmpeg muxing, and server security.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const Icon = faq.icon || HelpCircle;

          return (
            <div
              key={faq.question}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 transition-colors hover:border-slate-700"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between p-4 text-left sm:p-5 focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-white sm:text-base">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 pt-0 text-xs sm:text-sm text-slate-400 leading-relaxed sm:px-5 pl-15 border-t border-slate-800/40">
                  <p className="mt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
