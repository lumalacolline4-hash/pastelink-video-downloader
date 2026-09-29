export type PlatformType =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'reddit'
  | 'vimeo'
  | 'direct'
  | 'web'
  | 'unknown';

export interface FormatOption {
  quality: string;
  ext: string;
  url: string;
  directUrl?: string;
  size?: string;
  codecInfo?: string;
  jobId?: string;
}

export interface VideoMetadata {
  url?: string;
  platform: PlatformType | string;
  videoId?: string;
  title: string;
  creator?: string;
  author?: string;
  thumbnail: string;
  duration?: string;
  jobId?: string;
  formats: FormatOption[];
  previewUrl?: string;
  codecVerified?: boolean;
  error?: string;
}

export interface DownloadApiResponse {
  success?: boolean;
  platform?: PlatformType | string;
  videoId?: string;
  thumbnail?: string;
  title?: string;
  author?: string;
  duration?: string;
  jobId?: string;
  formats?: FormatOption[];
  previewUrl?: string;
  codecVerified?: boolean;
  error?: string;
}

export * from './types/media';
