import { PlatformType } from '../types';

export function detectPlatform(url: string): PlatformType {
  try {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be') || host.includes('youtube-nocookie.com')) {
      return 'youtube';
    }

    if (host.includes('tiktok.com')) {
      return 'tiktok';
    }

    if (host.includes('instagram.com') || host.includes('instagr.am')) {
      return 'instagram';
    }

    if (host.includes('facebook.com') || host.includes('fb.watch') || host.includes('fb.com')) {
      return 'facebook';
    }

    if (host.includes('twitter.com') || host.includes('x.com')) {
      return 'twitter';
    }

    if (host.includes('reddit.com') || host.includes('redd.it')) {
      return 'reddit';
    }

    if (host.includes('vimeo.com')) {
      return 'vimeo';
    }

    const mediaExts = ['.mp4', '.mp3', '.m4a', '.webm', '.mov', '.wav', '.ogg'];
    if (mediaExts.some((ext) => pathname.endsWith(ext))) {
      return 'direct';
    }

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return 'web';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getYouTubeVideoId(url: string): string | null {
  try {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const match = clean.match(
      /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function cleanYouTubeUrl(url: string): string {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
}
