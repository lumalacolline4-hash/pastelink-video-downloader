import React from 'react';
import {
  Youtube,
  Video,
  Twitter,
  Instagram,
  Flame,
  PlayCircle,
  Facebook,
  Music,
  Tv,
  ArrowUpRight,
} from 'lucide-react';

interface PlatformInfo {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  maxResolution: string;
  audioSupport: string;
  watermarkRemoval: boolean;
  sampleUrl: string;
  description: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    maxResolution: 'Up to 4K (2160p)',
    audioSupport: '320kbps MP3 / M4A',
    watermarkRemoval: false,
    sampleUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'High-frame rate 60fps video, adaptive dash streams merged seamlessly via FFmpeg.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    maxResolution: '1080p HD (Original)',
    audioSupport: 'Original Sound MP3',
    watermarkRemoval: true,
    sampleUrl: 'https://www.tiktok.com/@creativestudio/video/733918239102839',
    description: 'Auto-strip TikTok moving logo and outro card for a pristine, watermark-free MP4.',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: Twitter,
    color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    maxResolution: '1080p / 720p',
    audioSupport: 'AAC / MP3 Audio',
    watermarkRemoval: false,
    sampleUrl: 'https://x.com/OpenAI/status/1758192957386342635',
    description: 'Direct MP4 extraction from tweets, video threads, and broadcast recordings.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    maxResolution: '1080p Full HD',
    audioSupport: 'Reel Audio Extract',
    watermarkRemoval: false,
    sampleUrl: 'https://www.instagram.com/reel/C8q_4Uau8-R/',
    description: 'Extract public Reels, carousel videos, and IGTV clips with preserved stereo audio.',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: Flame,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    maxResolution: 'Up to 1080p',
    audioSupport: 'MP3 Extract',
    watermarkRemoval: false,
    sampleUrl: 'https://www.reddit.com/r/NatureIsFuckingLit/comments/1chd7yv/',
    description: 'Solves Reddit separate video and audio stream issue by multiplexing them automatically.',
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    icon: PlayCircle,
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    maxResolution: '4K / 1440p / 1080p',
    audioSupport: '320kbps High-Fi',
    watermarkRemoval: false,
    sampleUrl: 'https://vimeo.com/76979871',
    description: 'Master-quality progressive and HLS streams from professional filmmakers.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    maxResolution: '1080p / 720p HD',
    audioSupport: 'Stereo MP3',
    watermarkRemoval: false,
    sampleUrl: 'https://www.facebook.com/watch/?v=10153231379946729',
    description: 'Download public FB Watch videos, stories, and shared reel clips.',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: Music,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    maxResolution: 'Audio Stream Only',
    audioSupport: 'Lossless WAV / 320k MP3',
    watermarkRemoval: false,
    sampleUrl: 'https://soundcloud.com/octobersveryown/drake-gods-plan',
    description: 'Convert music tracks, podcast episodes, and DJ sets into high-fidelity MP3.',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: Tv,
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    maxResolution: '1080p 60fps',
    audioSupport: 'Direct Stream Audio',
    watermarkRemoval: false,
    sampleUrl: 'https://clips.twitch.tv/GloriousTangibleTurtleKreygasm',
    description: 'Save gaming highlight clips and streamer moments instantly in native framerates.',
  },
];

interface PlatformsGridProps {
  onSelectSample: (url: string) => void;
}

export const PlatformsGrid: React.FC<PlatformsGridProps> = ({ onSelectSample }) => {
  return (
    <section id="platforms" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Supported Media Platforms
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
          Integrated with powerful extraction drivers and FFmpeg multiplexing. Click any platform to test with a verified sample link.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          return (
            <div
              key={platform.id}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${platform.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{platform.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{platform.maxResolution}</p>
                    </div>
                  </div>

                  {platform.watermarkRemoval && (
                    <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-500/30">
                      No Watermark
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  {platform.description}
                </p>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Audio:</span>
                  <span className="text-slate-300 font-mono">{platform.audioSupport}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onSelectSample(platform.sampleUrl)}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Try sample URL</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
