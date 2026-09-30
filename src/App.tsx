import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Downloader } from './components/Downloader';
import { VideoResult } from './components/VideoResult';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { NoAdsModal } from './components/NoAdsModal';
import { VideoMetadata, DownloadApiResponse } from './types';
import { cleanYouTubeUrl, detectPlatform } from './utils/detector';

export default function App() {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNoAdsOpen, setIsNoAdsOpen] = useState<boolean>(false);

  // Ensure dark mode class and storage are permanently cleared
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('pastelink_theme');
    } catch {}
  }, []);

  // Process URL using the backend contract: POST /api/download with JSON body
  const handleFetchVideo = async (url: string) => {
    let targetUrl = url.trim();
    const platform = detectPlatform(targetUrl);
    const isYouTube = platform === 'youtube';

    // Strip extra parameters and normalize URL
    if (isYouTube) {
      targetUrl = cleanYouTubeUrl(targetUrl);
    }
    console.log('[Pastelink] Processing targetUrl:', targetUrl);

    setIsLoading(true);
    setServerError(null);
    setMetadata(null);

    // 15 second timeout controller
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 15000);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        cache: 'no-store',
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          Accept: 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      clearTimeout(timeoutId);

      const data: DownloadApiResponse = await response.json().catch(() => null);

      if (!response.ok || !data || data.success === false || data.error) {
        const errMsg =
          data?.error ||
          `Server returned HTTP ${response.status}. Unable to process this video link.`;
        throw new Error(errMsg);
      }

      console.log('[Pastelink] API metadata returned:', data);

      // Display real metadata from backend. Never fall back to fake mock data.
      setMetadata({
        url: targetUrl,
        platform: data.platform || platform,
        title: data.title || 'Video',
        creator: data.author || '@creator',
        thumbnail: data.thumbnail || '',
        videoId: data.videoId,
        jobId: data.jobId,
        formats: data.formats || [],
        duration: data.duration,
        previewUrl: data.previewUrl,
      });

      // Scroll smoothly to the result card
      setTimeout(() => {
        const resCard = document.getElementById('video-result-card');
        if (resCard) {
          resCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[Pastelink] Error fetching video metadata:', err);
      const isAbort = err.name === 'AbortError' || abortController.signal.aborted;
      if (isAbort) {
        setServerError('Request timed out. The server or external platform took too long to respond.');
      } else {
        setServerError(err.message || 'Unable to process this link. Please check the URL and try again.');
      }
      setMetadata(null);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 transition-colors">
      {/* Sticky Header */}
      <Header onOpenNoAds={() => setIsNoAdsOpen(true)} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Centered Main Downloader */}
        <Downloader
          onFetchVideo={handleFetchVideo}
          isLoading={isLoading}
          serverError={serverError}
        />

        {/* Video Result Card (Rendered only when backend returns valid metadata) */}
        {metadata && (
          <VideoResult
            key={`${metadata.url}-${metadata.videoId || ''}`}
            metadata={metadata}
          />
        )}

        {/* Features Section */}
        <Features />

        {/* How It Works Section */}
        <HowItWorks />

        {/* FAQ Section */}
        <Faq />
      </main>

      {/* Footer */}
      <Footer />

      {/* No Ads Information Modal */}
      <NoAdsModal
        isOpen={isNoAdsOpen}
        onClose={() => setIsNoAdsOpen(false)}
      />
    </div>
  );
}
