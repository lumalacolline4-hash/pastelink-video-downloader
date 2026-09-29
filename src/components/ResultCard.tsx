import React, { useState } from 'react';
import {
  Download,
  Film,
  Music,
  Clock,
  User,
  Eye,
  Calendar,
  Sparkles,
  Check,
  Share2,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { MediaMetadata, DownloadRequest } from '../types/media';
import { formatNumber } from '../utils/security';

interface ResultCardProps {
  metadata: MediaMetadata;
  onInitiateDownload: (req: DownloadRequest) => void;
  isDownloading: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  metadata,
  onInitiateDownload,
  isDownloading,
}) => {
  const [formatType, setFormatType] = useState<'video' | 'audio'>('video');
  const [selectedResolution, setSelectedResolution] = useState<string>(
    metadata.videoFormats.find((f) => f.resolution === '1080p') ? '1080p' : '720p'
  );
  const [videoContainer, setVideoContainer] = useState<'mp4' | 'webm'>('mp4');
  const [selectedAudioExt, setSelectedAudioExt] = useState<'mp3' | 'm4a' | 'wav'>('mp3');
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<string>('320k');
  const [stripWatermark, setStripWatermark] = useState<boolean>(metadata.isTikTok);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(metadata.webpageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartDownload = () => {
    if (formatType === 'video') {
      onInitiateDownload({
        url: metadata.webpageUrl,
        formatType: 'video',
        format: videoContainer,
        resolution: selectedResolution,
        stripWatermark: metadata.isTikTok && stripWatermark,
      });
    } else {
      onInitiateDownload({
        url: metadata.webpageUrl,
        formatType: 'audio',
        format: selectedAudioExt,
        audioBitrate: selectedAudioBitrate,
        stripWatermark: metadata.isTikTok && stripWatermark,
      });
    }
  };

  const handleQuickMp3 = () => {
    onInitiateDownload({
      url: metadata.webpageUrl,
      formatType: 'audio',
      format: 'mp3',
      audioBitrate: '320k',
      stripWatermark: metadata.isTikTok && stripWatermark,
    });
  };

  const currentVideoOption = metadata.videoFormats.find(
    (f) => f.resolution === selectedResolution
  );

  return (
    <section className="mx-auto mt-4 max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl transition-all">
        {/* Card Header Strip */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-indigo-400">
              {metadata.extractorKey || metadata.extractor}
            </span>
            <span aria-hidden="true">·</span>
            <span>ID: {metadata.id.slice(0, 12)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
            <a
              href={metadata.webpageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <span>Source</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Media Thumbnail Preview */}
          <div className="lg:col-span-5">
            <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              {!imgError && metadata.thumbnail ? (
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950/40 p-4 text-center">
                  <Film className="h-10 w-10 text-indigo-400" />
                  <p className="mt-2 text-xs font-medium text-slate-300 line-clamp-2">
                    {metadata.title}
                  </p>
                </div>
              )}

              {/* Scrim Overlay & Duration Tag */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded bg-black/85 px-2 py-0.5 font-mono text-xs font-medium text-white shadow">
                <Clock className="h-3 w-3 text-slate-300" />
                <span>{metadata.durationFormatted}</span>
              </div>

              {metadata.isTikTok && (
                <div className="absolute top-2.5 left-2.5 rounded bg-cyan-950/80 px-2 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-500/30">
                  TikTok Video
                </div>
              )}
            </div>

            {/* Author / Metadata Info */}
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">
                  {metadata.uploader}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400">
                {metadata.viewCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatNumber(metadata.viewCount)} views</span>
                  </div>
                )}
                {metadata.uploadDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{metadata.uploadDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Customization Controls */}
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              {/* Media Title */}
              <h2 className="text-lg font-bold text-white sm:text-xl line-clamp-2">
                {metadata.title}
              </h2>

              {metadata.description && (
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  {metadata.description}
                </p>
              )}

              {/* Format Mode Tabs (Segmented Control) */}
              <div className="mt-5 flex items-center gap-1 rounded-xl bg-slate-950/90 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormatType('video')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                    formatType === 'video'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="h-4 w-4" />
                  <span>Video & Audio (MP4 / WebM)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormatType('audio')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                    formatType === 'audio'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Music className="h-4 w-4" />
                  <span>Audio Only (MP3 / M4A / WAV)</span>
                </button>
              </div>

              {/* Mode 1: Video Resolutions Grid */}
              {formatType === 'video' && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-medium flex items-center gap-1.5">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
                      Select Resolution:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">Container:</span>
                      <button
                        type="button"
                        onClick={() => setVideoContainer('mp4')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                          videoContainer === 'mp4'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        MP4
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoContainer('webm')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                          videoContainer === 'webm'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        WEBM
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {metadata.videoFormats.map((fmt) => {
                      const isSelected = selectedResolution === fmt.resolution;
                      return (
                        <button
                          key={fmt.resolution}
                          type="button"
                          onClick={() => setSelectedResolution(fmt.resolution)}
                          className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-bold text-xs">{fmt.resolutionLabel}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                          </div>
                          <span className="mt-1 font-mono text-[11px] text-slate-400">
                            {fmt.filesizeFormatted || 'Approx. standard'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mode 2: Audio Formats & Bitrates */}
              {formatType === 'audio' && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-medium">Audio Format & Extension:</span>
                    <div className="flex gap-1.5">
                      {(['mp3', 'm4a', 'wav'] as const).map((ext) => (
                        <button
                          key={ext}
                          type="button"
                          onClick={() => setSelectedAudioExt(ext)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold uppercase transition-colors ${
                            selectedAudioExt === ext
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          .{ext}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { bitrate: '320k', label: '320 kbps', sub: 'Studio' },
                      { bitrate: '256k', label: '256 kbps', sub: 'High' },
                      { bitrate: '192k', label: '192 kbps', sub: 'Standard' },
                      { bitrate: '128k', label: '128 kbps', sub: 'Compact' },
                    ].map((item) => {
                      const isSelected = selectedAudioBitrate === item.bitrate;
                      return (
                        <button
                          key={item.bitrate}
                          type="button"
                          onClick={() => setSelectedAudioBitrate(item.bitrate)}
                          className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-bold text-xs font-mono">{item.label}</span>
                          <span className="text-[10px] text-slate-400">{item.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TikTok Watermark Toggle */}
              {metadata.isTikTok && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-950/20 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs font-semibold text-cyan-200">
                        Strip TikTok Watermark
                      </p>
                      <p className="text-[11px] text-cyan-300/80">
                        Automatically extract original unbranded video stream
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStripWatermark(!stripWatermark)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      stripWatermark ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={stripWatermark}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        stripWatermark ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleStartDownload}
                disabled={isDownloading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>
                  Download {formatType === 'video' ? selectedResolution.toUpperCase() : selectedAudioExt.toUpperCase()}
                  {formatType === 'video' && currentVideoOption?.filesizeFormatted
                    ? ` (${currentVideoOption.filesizeFormatted})`
                    : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={handleQuickMp3}
                disabled={isDownloading}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-xs font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
                title="Quick 1-click 320kbps MP3 audio download"
              >
                <Music className="h-3.5 w-3.5 text-indigo-400" />
                <span>Extract 320k MP3</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
