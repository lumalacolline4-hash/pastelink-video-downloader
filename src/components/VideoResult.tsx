import React, { useState, useRef } from 'react';
import { Play, Download, Check, Sparkles, X, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { VideoMetadata, FormatOption } from '../types';
import { DownloadProgressHUD } from './DownloadProgressHUD';

interface VideoResultProps {
  metadata: VideoMetadata;
}

export const VideoResult: React.FC<VideoResultProps> = ({ metadata }) => {
  const [selectedFormatIndex, setSelectedFormatIndex] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const [showCookieGuide, setShowCookieGuide] = useState<boolean>(false);

  // Progressive Download HUD Telemetry
  const [progressPct, setProgressPct] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<'handshake' | 'transcoding' | 'streaming' | 'saving' | 'complete'>('handshake');
  const [progressStageText, setProgressStageText] = useState<string>('Connecting & handshake...');
  const [progressSpeed, setProgressSpeed] = useState<string>('0 MB/s');
  const [progressTransferred, setProgressTransferred] = useState<string>('0 MB');
  const [progressTotal, setProgressTotal] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);

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
  const isAudio = currentFormat.ext?.toLowerCase() === 'mp3' || currentFormat.quality?.toLowerCase().includes('audio');

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
    }
    setDownloading(false);
    setProgressPct(0);
  };

  const handleDownload = async () => {
    if (!currentFormat) return;
    setDownloading(true);
    setDownloadSuccess(false);
    setDownloadError(null);

    // Initial Telemetry Setup
    setProgressPct(6);
    setProgressStage('handshake');
    setProgressStageText('Resolving media stream gateway & handshake...');
    setProgressSpeed('Connecting...');
    setProgressTransferred('0 MB');
    setProgressTotal('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const safeTitle = (metadata.title || 'video')
      .replace(/[^a-zA-Z0-9_\- ]/g, '_')
      .trim()
      .slice(0, 50);
    const targetFilename = `${safeTitle || 'video'}.${currentFormat.ext || 'mp4'}`;

    // Smooth ticker during server transcode phase
    let currentSimPct = 6;
    const ticker = setInterval(() => {
      if (currentSimPct < 22) {
        currentSimPct += 3;
        setProgressPct(currentSimPct);
        setProgressStage('handshake');
        setProgressStageText('Negotiating stream packets & bitrate...');
      } else if (currentSimPct < 45) {
        currentSimPct += 1.8;
        setProgressPct(Math.round(currentSimPct));
        setProgressStage('transcoding');
        setProgressStageText('Transcoding H.264 video & AAC audio (Universal)...');
        setProgressSpeed('Transcoding...');
      }
    }, 280);

    try {
      const response = await fetch(currentFormat.url, { signal: abortController.signal });
      clearInterval(ticker);

      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      if (!response.ok || contentType.includes('application/json')) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(
          errorJson?.error ||
          `Unable to download media stream (Server returned HTTP ${response.status}).`
        );
      }

      // Stream transfer phase
      setProgressStage('streaming');
      setProgressStageText('Streaming high-bitrate media packets...');
      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      if (totalBytes > 0) {
        setProgressTotal(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
      }

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            receivedBytes += value.length;

            const now = Date.now();
            const dt = (now - lastTime) / 1000;
            if (dt >= 0.25) {
              const bytesDiff = receivedBytes - lastBytes;
              const speedMb = (bytesDiff / (1024 * 1024)) / dt;
              setProgressSpeed(`${speedMb.toFixed(1)} MB/s`);
              lastTime = now;
              lastBytes = receivedBytes;
            }

            setProgressTransferred(`${(receivedBytes / (1024 * 1024)).toFixed(1)} MB`);

            if (totalBytes > 0) {
              const calculatedPct = Math.min(98, Math.round(45 + (receivedBytes / totalBytes) * 53));
              setProgressPct(calculatedPct);
            } else {
              setProgressPct((prev) => Math.min(98, prev + 1));
            }
          }
        }
      } else {
        // Fallback for browsers without stream reader
        const blobFallback = await response.blob();
        chunks.push(new Uint8Array(await blobFallback.arrayBuffer()));
      }

      // Final Assembly & Saving
      setProgressStage('saving');
      setProgressStageText('Verifying container & saving to device storage...');
      setProgressPct(100);

      const blob = new Blob(chunks as any[], { type: isAudio ? 'audio/mpeg' : 'video/mp4' });
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

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);

      setProgressStage('complete');
      setProgressStageText('✨ Complete! Saved to your Downloads folder.');
      setDownloadSuccess(true);

      setTimeout(() => {
        setDownloading(false);
        setTimeout(() => setDownloadSuccess(false), 5000);
      }, 2500);
    } catch (err: any) {
      clearInterval(ticker);
      if (err?.name === 'AbortError') {
        console.log('[Pastelink] Download cancelled by user');
        setDownloading(false);
        return;
      }
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

          <div className="space-y-3">
            {/* If downloading, render the futuristic Cyber Download Progress HUD */}
            {downloading ? (
              <DownloadProgressHUD
                percentage={progressPct}
                stage={progressStage}
                stageText={progressStageText}
                speed={progressSpeed}
                transferredFormatted={progressTransferred}
                totalFormatted={progressTotal}
                isAudio={isAudio}
                quality={currentFormat.quality}
                onCancel={handleCancelDownload}
              />
            ) : (
              /* Download Now Button */
              <button
                type="button"
                onClick={handleDownload}
                className="w-full h-14 rounded-2xl bg-[#00e575] hover:bg-[#00cf68] text-zinc-950 font-black text-base flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(0,229,117,0.35)] hover:shadow-[0_8px_25px_rgba(0,229,117,0.5)] transition-all cursor-pointer"
              >
                {downloadSuccess ? (
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
            )}

            {/* Error Message if download failed */}
            {downloadError && (
              <div className="mt-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1 space-y-1.5">
                  <p className="leading-relaxed">{downloadError}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCookieGuide(true)}
                      className="text-xs bg-red-500/20 hover:bg-red-500/30 text-white px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      💡 How to fix on Render (2 min)
                    </button>
                    <a
                      href={currentFormat.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#00e575] hover:underline font-bold"
                    >
                      <span>Direct stream attempt</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
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

      {/* Render Cookie / Proxy Fix Modal */}
      {showCookieGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-left text-zinc-200">
            <button
              onClick={() => setShowCookieGuide(false)}
              className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span className="text-[#00e575]">🚀</span> Fixing YouTube Downloads on Render
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              YouTube blocks cloud hosting providers (Render, Railway, AWS) with bot verification when downloading videos. Because your backend is on Render's cloud servers, YouTube requires a session cookie or residential proxy.
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="bg-zinc-800/70 border border-zinc-700/60 p-3.5 rounded-2xl">
                <p className="font-bold text-white mb-1">Option 1: Add YouTube Cookies to Render (Free &amp; 2 Mins)</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>Install the free Chrome extension <strong className="text-white">"Get cookies.txt LOCALLY"</strong>.</li>
                  <li>Go to <strong className="text-white">youtube.com</strong> and click the extension icon to export cookies as text.</li>
                  <li>Go to your <strong className="text-white">Render Dashboard &rarr; Your Web Service &rarr; Environment</strong>.</li>
                  <li>Click <strong className="text-white">Add Environment Variable</strong>:</li>
                </ol>
                <div className="mt-2 p-2 bg-black/60 rounded font-mono text-[11px] text-[#00e575]">
                  KEY: YTDLP_COOKIES_CONTENT<br/>
                  VALUE: [Paste the exported cookies text here]
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">Save changes. Render will restart automatically and all YouTube videos will download!</p>
              </div>

              <div className="bg-zinc-800/70 border border-zinc-700/60 p-3.5 rounded-2xl">
                <p className="font-bold text-white mb-1">Option 2: Use a Residential Proxy</p>
                <p className="text-zinc-300 mb-1.5">If you have a proxy (e.g., Webshare, BrightData, or IPRoyal), add this in Render:</p>
                <div className="p-2 bg-black/60 rounded font-mono text-[11px] text-[#00e575]">
                  KEY: PROXY_URL<br/>
                  VALUE: http://user:pass@proxy-ip:port
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCookieGuide(false)}
                className="px-5 py-2.5 rounded-xl bg-[#00e575] text-zinc-950 font-bold text-xs hover:bg-[#00e575]/90 cursor-pointer"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
