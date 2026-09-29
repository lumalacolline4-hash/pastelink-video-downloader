/**
 * Security and URL validation utilities
 */

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
  'instance-data',
];

const PRIVATE_IP_REGEX = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;

export function isValidMediaUrl(urlString: string): { valid: boolean; error?: string; hostname?: string } {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Please enter a valid URL' };
  }

  const trimmed = urlString.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum allowable length (2048 characters)' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format. Please include http:// or https://' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are supported' };
  }

  const host = parsed.hostname.toLowerCase();

  // SSRF checks
  if (BLOCKED_HOSTS.includes(host) || PRIVATE_IP_REGEX.test(host)) {
    return { valid: false, error: 'Access to private internal network addresses is prohibited' };
  }

  return { valid: true, hostname: host };
}

export function detectPlatform(urlString: string): {
  name: string;
  badge: string;
  iconName: string;
  accentColor: string;
} {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return { name: 'YouTube', badge: 'YouTube', iconName: 'Youtube', accentColor: 'text-red-500' };
    }
    if (host.includes('tiktok.com')) {
      return { name: 'TikTok', badge: 'TikTok', iconName: 'Video', accentColor: 'text-cyan-400' };
    }
    if (host.includes('twitter.com') || host.includes('x.com')) {
      return { name: 'Twitter / X', badge: 'X (Twitter)', iconName: 'Twitter', accentColor: 'text-sky-400' };
    }
    if (host.includes('instagram.com')) {
      return { name: 'Instagram', badge: 'Instagram', iconName: 'Instagram', accentColor: 'text-pink-500' };
    }
    if (host.includes('reddit.com') || host.includes('redd.it')) {
      return { name: 'Reddit', badge: 'Reddit', iconName: 'Flame', accentColor: 'text-orange-500' };
    }
    if (host.includes('vimeo.com')) {
      return { name: 'Vimeo', badge: 'Vimeo', iconName: 'PlayCircle', accentColor: 'text-blue-400' };
    }
    if (host.includes('facebook.com') || host.includes('fb.watch')) {
      return { name: 'Facebook', badge: 'Facebook', iconName: 'Facebook', accentColor: 'text-blue-500' };
    }
    if (host.includes('soundcloud.com')) {
      return { name: 'SoundCloud', badge: 'SoundCloud', iconName: 'Music', accentColor: 'text-amber-500' };
    }
    if (host.includes('archive.org')) {
      return { name: 'Archive.org', badge: 'Archive.org', iconName: 'Library', accentColor: 'text-emerald-400' };
    }
  } catch {
    // ignore
  }

  return { name: 'Universal Web', badge: 'Web Media', iconName: 'Globe', accentColor: 'text-indigo-400' };
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatNumber(num?: number): string {
  if (num === undefined || num === null) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}
