import React, { useState } from 'react';
import { Play, Download, Check, Sparkles, X, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { VideoMetadata, FormatOption } from '../types';

interface VideoResultProps {
  metadata: VideoMetadata;
}

export const VideoResult: React.FC<VideoResultProps> = ({ metadata }) => {
  const [selectedFormatIndex, setSelectedFormatIndex] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const formats: FormatOption[] = metadata.formats && metadata.formats.length > 0
    ? metadata.formats
    : [
        {
          quality: 'HD (1080p)',
          ext: 'mp4',
          url: `/api/download/stream?jobId=${metadata.jobId || ''}&quality=HD&url=${encodeURIComponent(metadata.url || '')}`,
          size: '1080p Universal MP4',
        },
        {
          quality: 'SD (720p)',
          ext: 'mp4',
          url: `/api/download/stream?jobId=${metadata.jobId || ''}&quality=SD&url=${encodeURIComponent(metadata.url || '')}`,
          size: '720p Universal MP4',
        },
        {
          quality: 'Audio Only (MP3)',
          ext: 'mp3',
          url: `/api/download/stream?jobId=${metadata.jobId || ''}&quality=AUDIO&url=${encodeURIComponent(metadata.url || '')}`,
          size: '320k Universal MP3',
        },
      ];

  const currentFormat = formats[selectedFormatIndex] || formats[0];

  const handleDownload = async () => {
    if (!currentFormat) return;
    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);

    const safeTitle = (metadata.title || 'video')
      .replace(/[^a-zA-Z0-9_\- ]/g, '_')
      .trim()
      .slice(0, 50);
    const targetFilename = `${safeTitle || 'video'}.${currentFormat.ext || 'mp4'}`;

    try {
      // Fetch stream to verify it's a real media file and NOT an HTML/JSON error page
      const response = await fetch(currentFormat.url);
      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      if (!response.ok || contentType.includes('application/json')) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(
          errorJson?.error ||
          `Unable to download media stream (Server returned HTTP ${response.status}).`
        );
      }

      // Convert verified media bytes to blob and trigger real browser file download
      const blob = await response.blob();
      if (blob.size < 1000) {
        throw new Error('Downloaded stream was incomplete or empty. Please try another quality format.');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up object URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);

      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err: any) {
      console.warn('[Pastelink Download Error]', err);
      setDownloading(false);
      setDownloadError(
        err?.message ||
        'The media stream could not be converted. Please try another format or link.'
      );
    }
  };

  // Preview URL with inline streaming & range requests enabled
  const previewSrc =
    metadata.previewUrl ||
    currentFormat?.directUrl ||
    (currentFormat?.url ? `${currentFormat.url}&preview=true` : '');

  return (
    <section id="video-result-card" className="max-w-4xl mx-auto px-4 sm:px-6 my-8">
      <div className="bg-white dark:bg-[#12141c] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Thumbnail & Play Preview */}
        <div>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-800 group">
            <img
              src={metadata.thumbnail || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80'}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Play Overlay Button */}
            <button
              type="button"
              onClick={() => {
                setDownloadError(null);
                setPreviewOpen(true);
              }}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/70 hover:bg-[#00e575] hover:text-zinc-950 text-white flex items-center justify-center transition-all scale-100 hover:scale-110 shadow-lg cursor-pointer"
              title="Play Video Preview"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>

            {metadata.duration && (
              <span className="absolute bottom-2.5 right-2.5 bg-black/85 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                {metadata.duration}
              </span>
            )}

            <span className="absolute top-2.5 left-2.5 bg-[#00e575] text-zinc-950 text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {metadata.platform}
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
              {metadata.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 font-semibold">
              <span>{metadata.creator || metadata.author || '@creator'}</span>
              <span>•</span>
              <span className="text-[#00e575] font-bold">Universal H.264 + AAC (Plays Anywhere)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quality / Format Options & Download Button */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3.5">
              Choose Format & Quality:
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {formats.map((fmt, idx) => {
                const isSelected = selectedFormatIndex === idx;
                return (
                  <button
                    key={`${fmt.quality}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedFormatIndex(idx);
                      setDownloadError(null);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00e575] bg-[#00e575]/10 shadow-[0_0_15px_rgba(0,229,117,0.25)]'
                        : 'border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-900/60 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                        {fmt.ext.toUpperCase()}
                      </span>
                      {isSelected && <Sparkles className="w-3.5 h-3.5 text-[#00e575]" />}
                    </div>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {fmt.quality}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-1 font-mono">
                      {fmt.size || 'Universal'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {/* Download Now Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full h-14 rounded-2xl bg-[#00e575] hover:bg-[#00cf68] text-zinc-950 font-black text-base flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(0,229,117,0.35)] hover:shadow-[0_8px_25px_rgba(0,229,117,0.5)] transition-all disabled:opacity-60 cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing Universal MP4...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Download Complete!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download {currentFormat.quality}</span>
                </>
              )}
            </button>

            {/* Error Message if download failed */}
            {downloadError && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{downloadError}</p>
                  <a
                    href={currentFormat.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#00e575] hover:underline mt-1 font-bold"
                  >
                    <span>Try direct stream link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 text-center mt-3 leading-relaxed">
              Videos are transcoded into universal H.264 + AAC format with FastStart enabled for guaranteed playback on iPhone, Android, QuickTime, Windows Media Player, and VLC.
            </p>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-2xl">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-6 h-6" />
            </button>
            <h4 className="text-base font-bold text-white mb-4 pr-8 truncate">
              {metadata.title}
            </h4>
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video
                src={previewSrc}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span>Universal Stream Preview</span>
              <a
                href={currentFormat.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#00e575] hover:underline inline-flex items-center gap-1 font-bold"
              >
                <span>Direct File Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
