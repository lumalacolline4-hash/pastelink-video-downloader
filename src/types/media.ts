export interface VideoFormatOption {
  formatId: string;
  resolution: string; // e.g., '4K (2160p)', '1080p (FHD)', '720p (HD)', '480p (SD)', '360p'
  resolutionLabel: string;
  ext: 'mp4' | 'webm';
  vcodec?: string;
  acodec?: string;
  filesizeApprox?: number;
  filesizeFormatted?: string;
  fps?: number;
  hasAudio: boolean;
  width?: number;
  height?: number;
}

export interface AudioFormatOption {
  formatId: string;
  ext: 'mp3' | 'm4a' | 'wav';
  bitrate: string; // '320k', '256k', '192k', '128k'
  bitrateLabel: string;
  filesizeApprox?: number;
  filesizeFormatted?: string;
}

export interface MediaMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number; // in seconds
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  uploaderUrl?: string;
  viewCount?: number;
  likeCount?: number;
  uploadDate?: string;
  extractor: string;
  extractorKey: string;
  webpageUrl: string;
  videoFormats: VideoFormatOption[];
  audioFormats: AudioFormatOption[];
  isTikTok: boolean;
  isYouTube: boolean;
  isTwitter: boolean;
  isInstagram: boolean;
  isReddit: boolean;
  isVimeo: boolean;
  watermarkRemovalAvailable: boolean;
}

export type TaskStatus = 'queued' | 'downloading' | 'processing' | 'ready' | 'error' | 'cancelled';

export interface DownloadProgress {
  taskId: string;
  percentage: number;
  speed: string;
  eta: string;
  downloadedBytes: string;
  totalBytes: string;
  status: TaskStatus;
  statusMessage: string;
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  downloadUrl?: string;
  error?: string;
}

export interface DownloadRequest {
  url: string;
  formatType: 'video' | 'audio';
  format: 'mp4' | 'webm' | 'mp3' | 'm4a' | 'wav';
  resolution?: string; // e.g., '2160p', '1080p', '720p', '480p', '360p', 'best'
  formatId?: string;
  audioBitrate?: string; // '320k', '256k', '192k', '128k'
  stripWatermark?: boolean;
}

export interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  extractor: string;
  formatType: 'video' | 'audio';
  format: string;
  resolutionOrBitrate: string;
  fileSizeFormatted?: string;
  downloadedAt: number;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded';
  ytdlpVersion: string;
  ffmpegVersion: string;
  nodeVersion: string;
  activeTasks: number;
  uptimeSeconds: number;
  tempStoragePath: string;
}
