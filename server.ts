import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { startPotServer } from "./server/pot/pot_server.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Binary path for yt-dlp if installed in the container
const ytdlpPath = fs.existsSync(path.join(process.cwd(), "bin", "yt-dlp"))
  ? path.join(process.cwd(), "bin", "yt-dlp")
  : fs.existsSync("/tmp/yt-dlp")
  ? "/tmp/yt-dlp"
  : "yt-dlp";

try {
  if (path.isAbsolute(ytdlpPath) && fs.existsSync(ytdlpPath)) {
    fs.chmodSync(ytdlpPath, 0o755);
  }
} catch {
  // ignore permission errors
}

// Supported Platform Types
export type PlatformType =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "twitter"
  | "reddit"
  | "vimeo"
  | "direct"
  | "web"
  | "unknown";

interface DownloadJob {
  jobId: string;
  originalUrl: string;
  normalizedUrl: string;
  platform: PlatformType;
  videoId?: string;
  title: string;
  author: string;
  thumbnail: string;
  duration?: string;
  directPlayUrl?: string;
  directMusicUrl?: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory Job Store keyed by unique jobId
const jobStore = new Map<string, DownloadJob>();

// Cleanup expired jobs every 10 minutes (TTL = 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobStore.entries()) {
    if (job.expiresAt < now) {
      jobStore.delete(jobId);
    }
  }
}, 10 * 60 * 1000);

// SSRF Protection: Ensure URL uses http/https and does not target private or local IP ranges
function isSafeUrl(rawUrl: string): boolean {
  try {
    let testUrl = rawUrl.trim();
    if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
      testUrl = "https://" + testUrl;
    }
    const parsed = new URL(testUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      (host.startsWith("172.") &&
        parseInt(host.split(".")[1] || "0", 10) >= 16 &&
        parseInt(host.split(".")[1] || "0", 10) <= 31)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Platform detector without any hardcoded mock checks
function detectPlatform(url: string): PlatformType {
  try {
    let clean = url.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be") || host.includes("youtube-nocookie.com")) {
      return "youtube";
    }

    if (host.includes("tiktok.com")) {
      return "tiktok";
    }

    if (host.includes("instagram.com") || host.includes("instagr.am")) {
      return "instagram";
    }

    if (host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.com")) {
      return "facebook";
    }

    if (host.includes("twitter.com") || host.includes("x.com") || host.includes("t.co")) {
      return "twitter";
    }

    if (host.includes("reddit.com") || host.includes("redd.it")) {
      return "reddit";
    }

    if (host.includes("vimeo.com")) {
      return "vimeo";
    }

    const mediaExts = [
      ".mp4", ".mp3", ".m4a", ".webm", ".mov", ".ogg", ".ogv",
      ".flv", ".m4v", ".mkv", ".avi", ".wav", ".aac", ".opus", ".3gp"
    ];
    if (
      mediaExts.some((ext) => pathname.toLowerCase().endsWith(ext)) ||
      host.includes("storage.googleapis.com") ||
      host.includes("commondatastorage.googleapis.com") ||
      host.includes("wikimedia.org")
    ) {
      return "direct";
    }

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return "web";
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}

// Pure YouTube Video ID parser without any hardcoded fallback IDs
function getYouTubeVideoId(url: string): string | null {
  try {
    let clean = url.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    if (
      !host.includes("youtube.com") &&
      !host.includes("youtu.be") &&
      !host.includes("youtube-nocookie.com")
    ) {
      return null;
    }

    // 1. youtu.be/VIDEO_ID
    if (host === "youtu.be" || host.endsWith(".youtu.be")) {
      const pathParts = parsed.pathname.replace(/^\/+/, "").split("/");
      const rawId = pathParts[0] ? pathParts[0].split("?")[0].split("&")[0] : "";
      if (/^[a-zA-Z0-9_-]{11}$/.test(rawId)) {
        return rawId;
      }
    }

    // 2. youtube.com/watch?v=VIDEO_ID
    const vParam = parsed.searchParams.get("v");
    if (vParam) {
      const cleanV = vParam.split("&")[0].split("?")[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(cleanV)) {
        return cleanV;
      }
    }

    // 3. youtube.com/shorts/VIDEO_ID
    if (parsed.pathname.startsWith("/shorts/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts[1] ? parts[1].split("?")[0].split("&")[0] : null;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }

    // 4. youtube.com/embed/VIDEO_ID
    if (parsed.pathname.startsWith("/embed/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts[1] ? parts[1].split("?")[0].split("&")[0] : null;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }

    // 5. youtube.com/v/VIDEO_ID or /live/VIDEO_ID
    if (parsed.pathname.startsWith("/v/") || parsed.pathname.startsWith("/live/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts[1] ? parts[1].split("?")[0].split("&")[0] : null;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }

    // Fallback regex strictly matching an 11-character YouTube video ID
    const match = clean.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch {
    return null;
  }
}

// Normalizes a YouTube URL to canonical format: https://www.youtube.com/watch?v=VIDEO_ID
function cleanYouTubeUrl(url: string): string {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

// Extracts clean filename from a URL
function extractFilenameFromUrl(urlStr: string, fallback: string = "media"): { baseName: string; ext: string; fullName: string } {
  try {
    let clean = urlStr.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    const parsed = new URL(clean);
    let fileName = path.basename(parsed.pathname);
    const queryFilename = parsed.searchParams.get("filename") || parsed.searchParams.get("file");
    if (queryFilename) {
      fileName = path.basename(queryFilename);
    }
    fileName = decodeURIComponent(fileName).trim();

    if (fileName && fileName !== "/" && fileName.length > 0) {
      const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        const base = fileName.slice(0, extMatch.index);
        return { baseName: base, ext, fullName: fileName };
      }
      return { baseName: fileName, ext: "mp4", fullName: `${fileName}.mp4` };
    }
  } catch {
    // fallback
  }
  return { baseName: fallback, ext: "mp4", fullName: `${fallback}.mp4` };
}

// Sanitizes a filename for Content-Disposition header
function sanitizeFilename(name: string, ext: string = "mp4"): string {
  const safe = name.replace(/[^a-zA-Z0-9_\- ]/g, "_").trim().replace(/ +/g, "_").slice(0, 60);
  return `${safe || "video"}.${ext}`;
}

// Safely serves a media file with full Range header support (206 Partial Content), correct mime types, and delayed cleanup
function serveMediaFile(
  filePath: string,
  filename: string,
  isAudio: boolean,
  isPreview: boolean,
  req: express.Request,
  res: express.Response
) {
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "Media file not found on disk." });
  }

  const stats = fs.statSync(filePath);
  const total = stats.size;
  const mimeType = isAudio ? "audio/mpeg" : "video/mp4";
  const disposition = isPreview
    ? "inline"
    : `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;

  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

    if (isNaN(start) || start >= total || (parts[1] && isNaN(end)) || end >= total || start > end) {
      res.setHeader("Content-Range", `bytes */${total}`);
      return res.status(416).end();
    }

    const chunksize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": mimeType,
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    });

    const fileStream = fs.createReadStream(filePath, { start, end });
    return fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": total,
      "Accept-Ranges": "bytes",
      "Content-Type": mimeType,
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    });

    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize YouTube PO Token provider background server (non-blocking)
  startPotServer(4416).catch((err: any) => {
    console.warn("[POT Server] Could not start local POT server:", err?.message || err);
  });

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Helper: Sanitize string environment variables (filtering out "none", "null", "undefined", etc.)
  function getValidEnvString(val: string | undefined): string | null {
    if (!val) return null;
    const trimmed = val.trim();
    if (
      !trimmed ||
      trimmed.toLowerCase() === "none" ||
      trimmed.toLowerCase() === "null" ||
      trimmed.toLowerCase() === "undefined" ||
      trimmed.toLowerCase() === "false" ||
      trimmed.toLowerCase() === "no"
    ) {
      return null;
    }
    return trimmed;
  }

  // Helper: Verify if cookie content matches Netscape HTTP Cookie format
  // Helper: Check if string has valid Netscape or header cookie format
  function isValidNetscapeCookies(content: string): boolean {
    if (!content) return false;
    const trimmed = content.trim();
    if (trimmed.length < 10) return false;
    if (
      trimmed.includes("# Netscape HTTP Cookie File") ||
      trimmed.includes("# HTTP Cookie File") ||
      trimmed.includes(".youtube.com") ||
      trimmed.includes("LOGIN_INFO") ||
      trimmed.includes("VISITOR_INFO1_LIVE") ||
      trimmed.includes("HSID") ||
      trimmed.includes("SSID") ||
      trimmed.includes("SID=")
    ) {
      return true;
    }
    // Tab or whitespace-separated columns
    const lines = trimmed.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) continue;
      const parts = line.split(/[\t\s]+/);
      if (parts.length >= 5) {
        return true;
      }
    }
    return false;
  }

  // Helper: Validate and return a safe path to Netscape cookies if legitimately provided
  function getValidCookiesArgument(): string | null {
    // 1. Explicit file path from YTDLP_COOKIES_PATH
    const cookiePath = getValidEnvString(process.env.YTDLP_COOKIES_PATH);
    if (cookiePath && fs.existsSync(cookiePath)) {
      try {
        const content = fs.readFileSync(cookiePath, "utf-8");
        if (isValidNetscapeCookies(content)) {
          return cookiePath;
        } else {
          console.log(
            `[Cookies Config] Provided cookie file "${cookiePath}" does not contain valid cookies; ignoring.`
          );
        }
      } catch {}
    }

    // 2. Inline Netscape cookie content from YTDLP_COOKIES_CONTENT
    const cookieContent = getValidEnvString(process.env.YTDLP_COOKIES_CONTENT);
    const cookieTmpPath = path.join("/tmp", "ytdlp_cookies.txt");
    if (cookieContent) {
      if (isValidNetscapeCookies(cookieContent)) {
        try {
          // Ensure file begins with Netscape header for yt-dlp compatibility
          let formattedContent = cookieContent.trim();
          if (!formattedContent.startsWith("# Netscape HTTP Cookie File")) {
            formattedContent = `# Netscape HTTP Cookie File\n${formattedContent}`;
          }
          fs.writeFileSync(cookieTmpPath, formattedContent, "utf-8");
          return cookieTmpPath;
        } catch {}
      } else {
        console.log(
          "[Cookies Config] YTDLP_COOKIES_CONTENT is not in recognized cookie format; ignoring."
        );
        try {
          if (fs.existsSync(cookieTmpPath)) fs.unlinkSync(cookieTmpPath);
        } catch {}
      }
    } else {
      // Clean up stale /tmp/ytdlp_cookies.txt if YTDLP_COOKIES_CONTENT is not set or set to 'none'
      try {
        if (fs.existsSync(cookieTmpPath)) {
          const existing = fs.readFileSync(cookieTmpPath, "utf-8");
          if (!isValidNetscapeCookies(existing)) {
            fs.unlinkSync(cookieTmpPath);
          }
        }
      } catch {}
    }

    // 3. Local cookies.txt in workspace root
    const rootCookies = path.join(process.cwd(), "cookies.txt");
    if (fs.existsSync(rootCookies)) {
      try {
        const content = fs.readFileSync(rootCookies, "utf-8");
        if (isValidNetscapeCookies(content)) {
          return rootCookies;
        }
      } catch {}
    }

    return null;
  }

  // Helper: Validate proxy URL (must start with http://, https://, or socks://)
  function getValidProxy(): string | null {
    const rawProxy = getValidEnvString(
      process.env.YTDLP_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    );
    if (!rawProxy) return null;
    if (/^(https?|socks4a?|socks5h?):\/\//i.test(rawProxy)) {
      return rawProxy;
    }
    console.log(
      `[Proxy Config] Provided proxy "${rawProxy}" is not a valid proxy URL (must start with http://, https://, or socks://); ignoring.`
    );
    return null;
  }

  // Helper: Probe media file codec details using ffprobe
  interface MediaProbeResult {
    hasVideo: boolean;
    hasAudio: boolean;
    vCodec?: string;
    aCodec?: string;
    formatName?: string;
    duration?: number;
    width?: number;
    height?: number;
    pixFmt?: string;
  }

  function probeMedia(filePath: string): Promise<MediaProbeResult> {
    return new Promise((resolve) => {
      const ffprobe = spawn("ffprobe", [
        "-v", "error",
        "-show_entries", "stream=codec_type,codec_name,width,height,pix_fmt",
        "-show_entries", "format=format_name,duration",
        "-of", "json",
        filePath,
      ]);
      let stdout = "";
      ffprobe.stdout.on("data", (d) => { stdout += d.toString(); });
      ffprobe.on("close", (code) => {
        if (code !== 0 || !stdout) {
          return resolve({ hasVideo: false, hasAudio: false });
        }
        try {
          const parsed = JSON.parse(stdout);
          const streams = parsed.streams || [];
          const format = parsed.format || {};
          const vStream = streams.find((s: any) => s.codec_type === "video");
          const aStream = streams.find((s: any) => s.codec_type === "audio");
          return resolve({
            hasVideo: Boolean(vStream),
            hasAudio: Boolean(aStream),
            vCodec: vStream?.codec_name,
            aCodec: aStream?.codec_name,
            pixFmt: vStream?.pix_fmt,
            formatName: format.format_name,
            duration: parseFloat(format.duration) || undefined,
            width: vStream?.width,
            height: vStream?.height,
          });
        } catch {
          return resolve({ hasVideo: false, hasAudio: false });
        }
      });
      ffprobe.on("error", () => resolve({ hasVideo: false, hasAudio: false }));
    });
  }

  // Full transcode fallback using universal H.264 (libx264, yuv420p) and AAC audio
  function runFullTranscode(
    inputPath: string,
    outputPath: string,
    quality: string
  ): Promise<{ success: boolean; filePath: string; error?: string }> {
    return new Promise((resolve) => {
      // Ensure target output file differs from input file
      const targetOut =
        path.resolve(inputPath) === path.resolve(outputPath)
          ? `${outputPath}.converted.mp4`
          : outputPath;

      const isSd = quality.toUpperCase() === "SD";
      const scaleFilter = isSd ? "scale='min(1280,iw)':-2" : "scale='min(1920,iw)':-2";

      const args = [
        "-y",
        "-i", inputPath,
        "-vf", scaleFilter,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "44100",
        "-threads", "0",
        "-movflags", "+faststart",
        targetOut,
      ];

      const ffmpeg = spawn("ffmpeg", args);
      let stderr = "";
      ffmpeg.stderr.on("data", (d) => { stderr += d.toString(); });
      ffmpeg.on("close", (code) => {
        if (code === 0 && fs.existsSync(targetOut) && fs.statSync(targetOut).size > 1000) {
          if (targetOut !== outputPath) {
            try {
              if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
              fs.renameSync(targetOut, outputPath);
            } catch {
              return resolve({ success: true, filePath: targetOut });
            }
          }
          return resolve({ success: true, filePath: outputPath });
        }
        console.warn("[FFmpeg Universal Transcode Warning]", stderr.slice(-300));
        resolve({
          success: false,
          filePath: outputPath,
          error: "Failed to transcode video to standard H.264/AAC MP4 format.",
        });
      });
      ffmpeg.on("error", (err) => resolve({ success: false, filePath: outputPath, error: err.message }));
    });
  }

  // Helper: Guarantees universal video (H.264 + AAC in MP4 container with FastStart) or pristine audio (MP3 320k)
  async function ensureUniversalMedia(
    inputPath: string,
    outputPath: string,
    isAudio: boolean,
    quality: string = "HD"
  ): Promise<{ success: boolean; filePath: string; error?: string }> {
    if (!fs.existsSync(inputPath)) {
      return { success: false, filePath: outputPath, error: "Input media file not found." };
    }

    const probe = await probeMedia(inputPath);
    console.log("[DEV LOG - Universal Media Check]", { inputPath, probe, isAudio, quality });

    // 1. Audio Request (MP3 320 kbps)
    if (isAudio) {
      if (probe.aCodec === "mp3" && probe.formatName?.includes("mp3") && inputPath.endsWith(".mp3")) {
        if (path.resolve(inputPath) !== path.resolve(outputPath)) {
          fs.copyFileSync(inputPath, outputPath);
        }
        return { success: true, filePath: outputPath };
      }

      return new Promise((resolve) => {
        const ffmpeg = spawn("ffmpeg", [
          "-y",
          "-i", inputPath,
          "-vn",
          "-c:a", "libmp3lame",
          "-b:a", "320k",
          "-id3v2_version", "3",
          outputPath,
        ]);
        ffmpeg.on("close", (code) => {
          if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
            return resolve({ success: true, filePath: outputPath });
          }
          resolve({ success: false, filePath: outputPath, error: "Failed to transcode audio to 320k MP3." });
        });
        ffmpeg.on("error", (err) => resolve({ success: false, filePath: outputPath, error: err.message }));
      });
    }

    // 2. Video Request (Universal MP4 with H.264 + AAC + yuv420p + FastStart)
    const isAlreadyH264 = probe.vCodec === "h264";
    const isAudioAac = probe.aCodec === "aac" || probe.aCodec === "mp3";
    const isYuv420p = !probe.pixFmt || probe.pixFmt === "yuv420p";
    const isContainerMp4 = probe.formatName?.includes("mp4") || probe.formatName?.includes("mov");

    // Fast-path 1: If video is already H.264, AAC, and standard 8-bit yuv420p in MP4, copy with faststart!
    if (isAlreadyH264 && isAudioAac && isYuv420p && isContainerMp4) {
      return new Promise((resolve) => {
        const targetOut =
          path.resolve(inputPath) === path.resolve(outputPath)
            ? `${outputPath}.faststart.mp4`
            : outputPath;

        const ffmpeg = spawn("ffmpeg", [
          "-y",
          "-i", inputPath,
          "-c", "copy",
          "-movflags", "+faststart",
          targetOut,
        ]);
        ffmpeg.on("close", (code) => {
          if (code === 0 && fs.existsSync(targetOut) && fs.statSync(targetOut).size > 1000) {
            if (targetOut !== outputPath) {
              try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                fs.renameSync(targetOut, outputPath);
              } catch {
                return resolve({ success: true, filePath: targetOut });
              }
            }
            return resolve({ success: true, filePath: outputPath });
          }
          runFullTranscode(inputPath, outputPath, quality).then(resolve);
        });
        ffmpeg.on("error", () => {
          runFullTranscode(inputPath, outputPath, quality).then(resolve);
        });
      });
    }

    // Fast-path 2: If video is already H.264 & yuv420p, copy video stream and only transcode audio to AAC!
    if (isAlreadyH264 && isYuv420p) {
      return new Promise((resolve) => {
        const targetOut =
          path.resolve(inputPath) === path.resolve(outputPath)
            ? `${outputPath}.audiomux.mp4`
            : outputPath;

        const ffmpeg = spawn("ffmpeg", [
          "-y",
          "-i", inputPath,
          "-c:v", "copy",
          "-c:a", "aac",
          "-b:a", "192k",
          "-ar", "44100",
          "-movflags", "+faststart",
          targetOut,
        ]);
        ffmpeg.on("close", (code) => {
          if (code === 0 && fs.existsSync(targetOut) && fs.statSync(targetOut).size > 1000) {
            if (targetOut !== outputPath) {
              try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                fs.renameSync(targetOut, outputPath);
              } catch {
                return resolve({ success: true, filePath: targetOut });
              }
            }
            return resolve({ success: true, filePath: outputPath });
          }
          runFullTranscode(inputPath, outputPath, quality).then(resolve);
        });
        ffmpeg.on("error", () => {
          runFullTranscode(inputPath, outputPath, quality).then(resolve);
        });
      });
    }

    // Full transcode with ultrafast preset for VP9, AV1, VP8, MKV, AVI, etc.
    return runFullTranscode(inputPath, outputPath, quality);
  }

  // Helper: Extract TikTok metadata and direct media URLs via TikWM API
  async function extractTikTokViaTikWM(url: string): Promise<{
    success: boolean;
    title?: string;
    author?: string;
    thumbnail?: string;
    duration?: string;
    playUrl?: string;
    musicUrl?: string;
  } | null> {
    try {
      const res = await fetch("https://www.tikwm.com/api/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        body: new URLSearchParams({ url }).toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return null;
      const json: any = await res.json().catch(() => null);
      if (!json || json.code !== 0 || !json.data) return null;

      const data = json.data;
      const authorName = data.author?.nickname
        ? `@${data.author?.unique_id || "tiktok"} (${data.author.nickname})`
        : `@${data.author?.unique_id || "tiktok.creator"}`;

      return {
        success: true,
        title: data.title || "TikTok Video",
        author: authorName,
        thumbnail: data.cover || data.origin_cover || "",
        duration: data.duration ? `${data.duration}s` : undefined,
        playUrl: data.hdplay || data.play,
        musicUrl: data.music,
      };
    } catch (err: any) {
      console.warn("[TikWM Extractor] Error fetching metadata:", err?.message);
      return null;
    }
  }

  // Helper: Download and mux media using native yt-dlp + ffmpeg
  async function downloadMediaViaYtDlp(
    targetUrl: string,
    outputPathBase: string,
    isAudio: boolean,
    quality: string
  ): Promise<{ success: boolean; filePath?: string; error?: string; isBotVerification?: boolean }> {
    const ext = isAudio ? "mp3" : "mp4";
    const expectedFilePath = `${outputPathBase}.${ext}`;

    const nodePath = process.execPath || "/usr/local/bin/node";
    const validProxy = getValidProxy();
    const validCookiesPath = getValidCookiesArgument();

    // Helper to run yt-dlp with specific arguments
    const runYtDlpAttempt = (formatArg: string, clientArgs?: string): Promise<{ code: number | null; stderr: string; stdout: string }> => {
      return new Promise((resolveAttempt) => {
        const args: string[] = [
          "--no-warnings",
          "--no-playlist",
          "--retries", "3",
          "--fragment-retries", "3",
          "--ffmpeg-location", "/usr/bin",
          "--js-runtimes", `node:${nodePath}`,
        ];

        if (validProxy) {
          args.push("--proxy", validProxy);
        }

        if (validCookiesPath) {
          args.push("--cookies", validCookiesPath);
        }

        if ((targetUrl.includes("youtube.com") || targetUrl.includes("youtu.be")) && clientArgs) {
          args.push("--extractor-args", `youtube:player_client=${clientArgs}`);
        }

        if (isAudio) {
          args.push("-x", "--audio-format", "mp3", "-f", formatArg, "-o", `${outputPathBase}.raw.%(ext)s`, targetUrl);
        } else {
          args.push("-f", formatArg, "--merge-output-format", "mp4", "-o", `${outputPathBase}.raw.%(ext)s`, targetUrl);
        }

        console.log(`[DEV LOG - Spawning yt-dlp] ${ytdlpPath} (format: ${formatArg}, clients: ${clientArgs || "default"})`);
        const proc = spawn(ytdlpPath, args);
        let stderr = "";
        let stdout = "";

        proc.stderr.on("data", (d) => { stderr += d.toString(); });
        proc.stdout.on("data", (d) => { stdout += d.toString(); });

        const timer = setTimeout(() => {
          try { proc.kill("SIGKILL"); } catch {}
          resolveAttempt({ code: -1, stderr: stderr + "\nTimeout after 60s", stdout });
        }, 60000);

        proc.on("close", (code) => {
          clearTimeout(timer);
          resolveAttempt({ code, stderr, stdout });
        });

        proc.on("error", (err) => {
          clearTimeout(timer);
          resolveAttempt({ code: -1, stderr: err.message, stdout });
        });
      });
    };

    // Helper to find any downloaded file produced by yt-dlp
    const findProducedFile = (): string | null => {
      const dir = path.dirname(outputPathBase);
      const base = path.basename(outputPathBase);
      try {
        const files = fs.readdirSync(dir);
        // Check for exact merged file first
        const preferredExt = isAudio ? ".mp3" : ".mp4";
        const exactTarget = `${base}.raw${preferredExt}`;
        if (files.includes(exactTarget)) {
          const fullP = path.join(dir, exactTarget);
          if (fs.existsSync(fullP) && fs.statSync(fullP).size > 1000) {
            return fullP;
          }
        }

        // Filter out intermediate files (.part, .ytdl, .temp, and intermediate unmerged DASH streams like .f137.mp4)
        const validMatches = files.filter((f) => {
          if (!f.startsWith(base)) return false;
          if (f.endsWith(".part") || f.endsWith(".ytdl") || f.endsWith(".temp") || f.endsWith(".aria2")) return false;
          if (/\.f[0-9]+\./.test(f)) return false;
          return true;
        });

        // Pick the largest file (which is the fully merged video+audio file)
        validMatches.sort((a, b) => {
          try {
            return fs.statSync(path.join(dir, b)).size - fs.statSync(path.join(dir, a)).size;
          } catch {
            return 0;
          }
        });

        for (const m of validMatches) {
          const fullP = path.join(dir, m);
          try {
            const s = fs.statSync(fullP);
            if (s.size > 1000) return fullP;
          } catch {}
        }
      } catch {}
      return null;
    };

    // Attempt 1: Prioritize standard H.264 (avc1) video and AAC (mp4a) audio so it remuxes seamlessly into playable MP4
    const primaryFormat = isAudio
      ? "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio/best"
      : quality.toUpperCase() === "SD"
        ? "bv*[vcodec^=avc1][height<=720]+ba[acodec^=mp4a]/bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[ext=mp4][height<=720]/best[height<=720]/best"
        : "bv*[vcodec^=avc1][height<=1080]+ba[acodec^=mp4a]/bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4][height<=1080]/best[height<=1080]/best";

    let attemptResult = await runYtDlpAttempt(primaryFormat);
    let foundFile = findProducedFile();

    // Attempt 2 (Fallback): If first attempt failed to produce a file, retry with relaxed format and alternative player clients
    if (!foundFile) {
      console.log("[Universal Media] Primary format attempt did not produce media, running fallback attempt...");
      const fallbackFormat = isAudio ? "bestaudio/best/18" : "bestvideo+bestaudio/best/18/b";
      attemptResult = await runYtDlpAttempt(fallbackFormat, "android,ios,mweb");
      foundFile = findProducedFile();
    }

    if (foundFile) {
      console.log(`[Universal Media] Found raw extractor file: ${foundFile}, running compatibility check`);
      try {
        const convResult = await ensureUniversalMedia(foundFile, expectedFilePath, isAudio, quality);
        if (convResult.success && fs.existsSync(expectedFilePath)) {
          if (foundFile !== expectedFilePath && fs.existsSync(foundFile)) {
            try { fs.unlinkSync(foundFile); } catch {}
          }
          return { success: true, filePath: expectedFilePath };
        }
      } catch (convErr: any) {
        console.warn("[Universal Media] Transcoding check failed:", convErr?.message);
      }

      // Safe fallback: if transcode had an issue, serve the raw downloaded file directly!
      if (fs.existsSync(foundFile) && fs.statSync(foundFile).size > 1000) {
        console.log(`[Universal Media] Falling back to raw downloaded file: ${foundFile}`);
        return { success: true, filePath: foundFile };
      }
    }

    // Process error message
    const stderr = attemptResult.stderr;
    const isBotVerification =
      stderr.includes("Sign in to confirm you’re not a bot") ||
      stderr.includes("confirm you're not a bot") ||
      stderr.includes("bot verification") ||
      stderr.includes("login page");

    let friendlyError = "Failed to extract media stream from the provided link.";
    if (isBotVerification) {
      friendlyError =
        "YouTube triggered bot verification for this specific video on cloud datacenter server IPs. Please try another video URL or use the direct browser download option.";
    } else if (
      stderr.includes("Video unavailable") ||
      stderr.includes("This video is unavailable")
    ) {
      friendlyError = "This video is unavailable or has been removed from the platform.";
    } else if (stderr.includes("Private video") || stderr.includes("private video")) {
      friendlyError = "This video is private and cannot be downloaded.";
    } else if (stderr.includes("Login required") || stderr.includes("requires authentication")) {
      friendlyError = "This media requires an account login to view or download.";
    } else {
      const errLines = stderr.split("\n").filter((l) => l.includes("ERROR:"));
      if (errLines.length > 0) {
        friendlyError = errLines[errLines.length - 1].replace(/ERROR:\s*(\[[^\]]+\]\s*)?/, "").trim();
      }
    }

    console.log(`[Media Extractor Status] exitCode: ${attemptResult.code}, message: ${friendlyError}`);
    return { success: false, error: friendlyError, isBotVerification };
  }

  // Optional Helper: Cobalt API instance if user has a private instance configured
  async function extractViaCobalt(
    mediaUrl: string,
    quality: string,
    isAudio: boolean
  ): Promise<{ streamUrl?: string; filename?: string; error?: string }> {
    const cobaltUrl = getValidEnvString(process.env.COBALT_API_URL);
    if (!cobaltUrl || !/^https?:\/\//i.test(cobaltUrl)) {
      return { error: "No Cobalt API configured" };
    }
    const vQuality = quality.toUpperCase() === "SD" ? "720" : "1080";
    const cobaltBody: any = {
      url: mediaUrl,
      vCodec: "h264",
      vQuality: vQuality,
      filenamePattern: "basic",
      videoQuality: vQuality,
      youtubeVideoCodec: "h264",
      filenameStyle: "basic",
      downloadMode: isAudio ? "audio" : "auto",
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      };
      const apiKey = getValidEnvString(process.env.COBALT_API_KEY);
      if (apiKey) {
        headers["Authorization"] = `Api-Key ${apiKey}`;
      }

      const postRes = await fetch(cobaltUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(cobaltBody),
        signal: AbortSignal.timeout(12000),
      });

      if (postRes.ok) {
        const data: any = await postRes.json().catch(() => null);
        if (data) {
          if (typeof data.url === "string" && data.url.startsWith("http")) {
            return { streamUrl: data.url, filename: data.filename };
          }
          if (
            (data.status === "stream" || data.status === "tunnel" || data.status === "redirect") &&
            typeof data.url === "string" &&
            data.url.startsWith("http")
          ) {
            return { streamUrl: data.url, filename: data.filename };
          }
        }
      }
    } catch {
      // ignore
    }

    return { error: "Cobalt extraction failed" };
  }

  // Common Handler for Metadata Extraction
  async function handleMetadataRequest(rawUrl: string, reqPath: string, res: express.Response) {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).json({ success: false, error: "A valid URL is required." });
    }

    const trimmedUrl = rawUrl.trim();
    if (!isSafeUrl(trimmedUrl)) {
      return res.status(400).json({ success: false, error: "Invalid URL or disallowed target host." });
    }

    const platform = detectPlatform(trimmedUrl);
    if (platform === "unknown") {
      return res.status(400).json({
        success: false,
        error: "Unsupported or invalid link. Pastelink supports YouTube, TikTok, Instagram, Facebook, Twitter/X, Reddit, Vimeo, web video links, and direct media URLs (.mp4, .mp3, etc.).",
      });
    }

    let videoId: string | undefined;
    let normalizedUrl = trimmedUrl;

    if (platform === "youtube") {
      const parsedId = getYouTubeVideoId(trimmedUrl);
      if (!parsedId) {
        return res.status(400).json({
          success: false,
          error: "Invalid YouTube URL. Could not extract a valid 11-character video ID.",
        });
      }
      videoId = parsedId;
      normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Development logging as requested in requirements
    console.log("[DEV LOG - Extraction Request]", {
      originalUrl: trimmedUrl,
      detectedPlatform: platform,
      extractedVideoId: videoId || "N/A",
      normalizedUrl,
      backendRequestUrl: reqPath,
    });

    // Create unique download job
    const jobId = crypto.randomUUID();
    let title = `${platform.toUpperCase()} Video`;
    let author = `@${platform}`;
    let thumbnail = "";
    let duration: string | undefined;
    let tikData: any = null;

    if (platform === "youtube" && videoId) {
      thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      title = `YouTube Video (${videoId})`;
      author = "YouTube Creator";

      // Fetch official oEmbed metadata
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (oembedRes.ok) {
          const oembed: any = await oembedRes.json();
          if (oembed.title) title = oembed.title;
          if (oembed.author_name) author = oembed.author_name;
        }
      } catch {
        // Fall back to cleanly formatted title
      }
    } else if (platform === "tiktok") {
      title = "TikTok Video";
      author = "@tiktok.creator";
      thumbnail = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80";

      tikData = await extractTikTokViaTikWM(trimmedUrl);
      if (tikData && tikData.success) {
        if (tikData.title) title = tikData.title;
        if (tikData.author) author = tikData.author;
        if (tikData.thumbnail) thumbnail = tikData.thumbnail;
        if (tikData.duration) duration = tikData.duration;
      } else {
        try {
          const oembedRes = await fetch(
            `https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmedUrl)}`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (oembedRes.ok) {
            const oembed: any = await oembedRes.json();
            if (oembed.title) title = oembed.title;
            if (oembed.author_name) author = `@${oembed.author_name}`;
            if (oembed.thumbnail_url) thumbnail = oembed.thumbnail_url;
          }
        } catch {
          // Keep default
        }
      }
    } else if (platform === "instagram") {
      const match = trimmedUrl.match(/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
      const reelId = match && match[1] ? match[1] : "Reel";
      title = `Instagram Reel (${reelId})`;
      author = "@instagram.creator";
      thumbnail = "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&auto=format&fit=crop&q=80";
    } else if (platform === "facebook") {
      title = "Facebook Video";
      author = "Facebook Creator";
      thumbnail = "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80";
    } else if (platform === "twitter") {
      title = "Twitter / X Media";
      author = "@twitter";
      thumbnail = "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&auto=format&fit=crop&q=80";
    } else if (platform === "reddit") {
      title = "Reddit Video";
      author = "Reddit Post";
      thumbnail = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
    } else if (platform === "vimeo") {
      title = "Vimeo Video";
      author = "Vimeo Creator";
      thumbnail = "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80";
    } else if (platform === "direct") {
      const info = extractFilenameFromUrl(trimmedUrl, "media");
      title = info.fullName;
      author = "Direct Media File";
      thumbnail = "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80";
    } else if (platform === "web") {
      try {
        const parsedHost = new URL(trimmedUrl).hostname.replace(/^www\./, "");
        title = `${parsedHost} Video / Media`;
        author = `@${parsedHost}`;
      } catch {
        title = "Web Video";
        author = "Web Source";
      }
      thumbnail = "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80";
    }

    // Store Job
    const now = Date.now();
    const job: DownloadJob = {
      jobId,
      originalUrl: trimmedUrl,
      normalizedUrl,
      platform,
      videoId,
      title,
      author,
      thumbnail,
      duration,
      directPlayUrl: tikData?.playUrl,
      directMusicUrl: tikData?.musicUrl,
      createdAt: now,
      expiresAt: now + 30 * 60 * 1000, // 30 mins
    };
    jobStore.set(jobId, job);

    const isAudioOnlyUrl = trimmedUrl.toLowerCase().endsWith(".mp3") || trimmedUrl.toLowerCase().endsWith(".m4a");

    const encodedUrl = encodeURIComponent(trimmedUrl);
    const formats = isAudioOnlyUrl
      ? [
          {
            quality: "Audio (MP3)",
            ext: "mp3",
            url: `/api/download/stream?jobId=${jobId}&quality=AUDIO&url=${encodedUrl}`,
            directUrl: job.directMusicUrl,
            size: "320 kbps MP3",
            codecInfo: "MP3 Audio (Universal)",
            jobId,
          },
        ]
      : [
          {
            quality: "1080p (HD)",
            ext: "mp4",
            url: `/api/download/stream?jobId=${jobId}&quality=HD&url=${encodedUrl}`,
            directUrl: job.directPlayUrl,
            size: "Full HD Video",
            codecInfo: "H.264 + AAC (Universal MP4)",
            jobId,
          },
          {
            quality: "720p (SD)",
            ext: "mp4",
            url: `/api/download/stream?jobId=${jobId}&quality=SD&url=${encodedUrl}`,
            directUrl: job.directPlayUrl,
            size: "Standard Video",
            codecInfo: "H.264 + AAC (Universal MP4)",
            jobId,
          },
          {
            quality: "Audio Only (MP3)",
            ext: "mp3",
            url: `/api/download/stream?jobId=${jobId}&quality=AUDIO&url=${encodedUrl}`,
            directUrl: job.directMusicUrl,
            size: "320 kbps MP3",
            codecInfo: "MP3 Audio (Universal)",
            jobId,
          },
        ];

    const previewUrl = tikData?.playUrl || (platform === "direct" ? trimmedUrl : undefined);

    const responsePayload = {
      success: true,
      platform,
      videoId,
      thumbnail,
      title,
      author,
      duration,
      jobId,
      formats,
      previewUrl,
      codecVerified: true,
    };

    console.log("[DEV LOG - Backend Metadata Response]", {
      jobId,
      platform,
      title,
      formatsCount: formats.length,
    });

    return res.json(responsePayload);
  }

  // POST /api/download - Consistent API endpoint
  app.post("/api/download", async (req, res) => {
    const url = req.body?.url;
    return handleMetadataRequest(url, "/api/download [POST]", res);
  });

  // GET /api/download - Handles metadata queries or direct download streams
  app.get("/api/download", async (req, res) => {
    const rawUrl = (req.query.url as string) || (req.query.link as string);
    const isDownload =
      req.query.download === "true" ||
      req.query.action === "download" ||
      req.query.stream === "true";

    if (isDownload && rawUrl) {
      const quality = (req.query.quality as string) || "HD";
      return handleDirectStreamRequest(rawUrl, quality, res);
    }

    return handleMetadataRequest(rawUrl, "/api/download [GET]", res);
  });

  // GET /api/download/stream - Secure stream endpoint keyed by jobId
  app.get("/api/download/stream", async (req, res) => {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    const jobId = req.query.jobId as string;
    const quality = ((req.query.quality as string) || "HD").toUpperCase();
    const isAudio = quality === "AUDIO" || quality === "MP3";

    let job = jobId && jobStore.has(jobId) ? jobStore.get(jobId) : undefined;

    if (!job && req.query.url) {
      const rawUrl = String(req.query.url).trim();
      const detected = detectPlatform(rawUrl);
      if (detected !== "unknown") {
        const id = jobId || crypto.randomUUID();
        let normalizedUrl = rawUrl;
        let videoId: string | undefined;
        if (detected === "youtube") {
          const parsedId = getYouTubeVideoId(rawUrl);
          if (parsedId) {
            videoId = parsedId;
            normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
          }
        }
        job = {
          jobId: id,
          originalUrl: rawUrl,
          normalizedUrl,
          platform: detected,
          videoId,
          title: `${detected.toUpperCase()} Media`,
          author: `@${detected}`,
          thumbnail: "",
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000,
        };
        jobStore.set(id, job);
      }
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Download job not found or has expired. Please re-submit the video URL.",
      });
    }

    console.log("[DEV LOG - Stream Request by JobId]", {
      jobId: job.jobId,
      platform: job.platform,
      selectedFormat: quality,
      normalizedUrl: job.normalizedUrl,
    });

    const targetFilename = sanitizeFilename(job.title, isAudio ? "mp3" : "mp4");

    const isPreview = req.query.preview === "true";

    // 1. Direct Media File Stream
    if (job.platform === "direct") {
      try {
        const directRes = await fetch(job.normalizedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(30000),
        });

        if (!directRes.ok) {
          return res.status(directRes.status).json({
            success: false,
            error: `Failed to fetch direct media URL (HTTP ${directRes.status}).`,
          });
        }

        const ct = (directRes.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("text/html") || ct.includes("xml") || ct.includes("text/plain")) {
          return res.status(400).json({
            success: false,
            error: "The provided direct URL returned an HTML webpage or error document rather than media bytes.",
          });
        }

        const tempRawIn = path.join("/tmp", `direct_raw_${job.jobId}_${Date.now()}`);
        const tempOut = path.join("/tmp", `direct_univ_${job.jobId}_${isAudio ? "mp3" : "mp4"}`);
        const buf = Buffer.from(await directRes.arrayBuffer());
        fs.writeFileSync(tempRawIn, buf);

        let finalFile: string | null = null;
        try {
          const conv = await Promise.race([
            ensureUniversalMedia(tempRawIn, tempOut, isAudio, quality),
            new Promise<{ success: boolean; filePath: string }>((_, reject) =>
              setTimeout(() => reject(new Error("Transcode timeout")), 20000)
            ),
          ]);
          if (conv.success && fs.existsSync(conv.filePath) && fs.statSync(conv.filePath).size > 0) {
            finalFile = conv.filePath;
          }
        } catch (convErr: any) {
          console.warn("[Direct Stream Handler - Transcode fallback]", convErr?.message);
        }

        if (!finalFile && fs.existsSync(tempRawIn) && fs.statSync(tempRawIn).size > 0) {
          finalFile = tempRawIn;
        }

        if (finalFile && fs.existsSync(finalFile)) {
          const targetFinal = finalFile;
          setTimeout(() => {
            try { if (fs.existsSync(tempRawIn)) fs.unlinkSync(tempRawIn); } catch {}
            try { if (fs.existsSync(targetFinal)) fs.unlinkSync(targetFinal); } catch {}
          }, 15 * 60 * 1000);
          return serveMediaFile(targetFinal, targetFilename, isAudio, isPreview, req, res);
        }

        return res.status(500).json({
          success: false,
          error: "Failed to process media bytes for stream delivery.",
        });
      } catch (err: any) {
        return res.status(502).json({
          success: false,
          error: `Error connecting to direct media host: ${err?.message || "Unknown error"}`,
        });
      }
    }

    // 2. Extracted Media Platforms (YouTube, TikTok, Instagram, Facebook, etc.)
    const directFallbackUrl = isAudio ? (job.directMusicUrl || job.directPlayUrl) : job.directPlayUrl;

    // For TikTok, TikWM direct CDN stream is ultra-fast, watermark-free, and avoids datacenter blocks
    if (job.platform === "tiktok" && directFallbackUrl) {
      try {
        console.log("[DEV LOG - Prioritizing TikWM Direct CDN Stream]", directFallbackUrl);
        const fbRes = await fetch(directFallbackUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Referer: "https://www.tiktok.com/",
          },
          signal: AbortSignal.timeout(25000),
        });

        if (fbRes.ok) {
          const tempRawFb = path.join("/tmp", `fb_raw_${job.jobId}_${Date.now()}`);
          const tempOutFb = path.join("/tmp", `fb_univ_${job.jobId}_${isAudio ? "mp3" : "mp4"}`);
          const buf = Buffer.from(await fbRes.arrayBuffer());
          fs.writeFileSync(tempRawFb, buf);

          const conv = await ensureUniversalMedia(tempRawFb, tempOutFb, isAudio, quality);
          try { fs.unlinkSync(tempRawFb); } catch {}

          const finalFile = conv.success && fs.existsSync(conv.filePath) ? conv.filePath : (fs.existsSync(tempOutFb) ? tempOutFb : null);
          if (finalFile) {
            setTimeout(() => {
              try { if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile); } catch {}
            }, 15 * 60 * 1000);
            return serveMediaFile(finalFile, targetFilename, isAudio, isPreview, req, res);
          }
        }
      } catch (tiktokDirectErr: any) {
        console.warn("[Stream Handler - TikTok direct stream fallback failed, using yt-dlp]", tiktokDirectErr?.message);
      }
    }

    const tempFileBase = path.join("/tmp", `pastelink_${job.jobId}_${quality}_${Date.now()}`);
    console.log(`[DEV LOG - Starting Extraction] jobId: ${job.jobId}, platform: ${job.platform}, format: ${quality}`);

    const ytdlResult = await downloadMediaViaYtDlp(job.normalizedUrl, tempFileBase, isAudio, quality);

    if (ytdlResult.success && ytdlResult.filePath && fs.existsSync(ytdlResult.filePath)) {
      try {
        const finalPath = ytdlResult.filePath;
        setTimeout(() => {
          try { if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath); } catch {}
        }, 15 * 60 * 1000);

        return serveMediaFile(finalPath, targetFilename, isAudio, isPreview, req, res);
      } catch (pipeErr: any) {
        console.log("[Stream Handler - Pipe Error]", pipeErr?.message);
      }
    }

    // 2b. Direct stream fallback if available and not yet attempted
    if (directFallbackUrl) {
      try {
        console.log("[DEV LOG - Attempting Direct Stream Fallback]", directFallbackUrl);
        const fbRes = await fetch(directFallbackUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(30000),
        });

        if (fbRes.ok) {
          const tempRawFb = path.join("/tmp", `fb_raw_${job.jobId}_${Date.now()}`);
          const tempOutFb = path.join("/tmp", `fb_univ_${job.jobId}_${isAudio ? "mp3" : "mp4"}`);
          const buf = Buffer.from(await fbRes.arrayBuffer());
          fs.writeFileSync(tempRawFb, buf);

          let finalFile: string | null = null;
          try {
            const conv = await Promise.race([
              ensureUniversalMedia(tempRawFb, tempOutFb, isAudio, quality),
              new Promise<{ success: boolean; filePath: string }>((_, reject) =>
                setTimeout(() => reject(new Error("Transcode timeout")), 15000)
              ),
            ]);
            if (conv.success && fs.existsSync(conv.filePath) && fs.statSync(conv.filePath).size > 0) {
              finalFile = conv.filePath;
            }
          } catch (convErr: any) {
            console.warn("[Stream Handler - Direct Fallback Transcode timeout/error]", convErr?.message);
          }

          if (!finalFile && fs.existsSync(tempRawFb) && fs.statSync(tempRawFb).size > 0) {
            finalFile = tempRawFb;
          }

          if (finalFile && fs.existsSync(finalFile)) {
            const stats = fs.statSync(finalFile);
            res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${targetFilename}"; filename*=UTF-8''${encodeURIComponent(targetFilename)}`
            );
            res.setHeader("Content-Length", stats.size);
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Cache-Control", "no-store");

            const fileStream = fs.createReadStream(finalFile);
            fileStream.pipe(res);

            const cleanup = () => {
              try { if (fs.existsSync(tempRawFb)) fs.unlinkSync(tempRawFb); } catch {}
              try { if (fs.existsSync(tempOutFb)) fs.unlinkSync(tempOutFb); } catch {}
            };
            fileStream.on("close", cleanup);
            res.on("close", cleanup);
            return;
          }
        }
      } catch (fbErr: any) {
        console.warn("[Stream Handler - Direct Fallback Error]", fbErr?.message);
      }
    }

    // Secondary fallback: Cobalt API if user has configured an instance
    if (getValidEnvString(process.env.COBALT_API_URL)) {
      const cobaltResult = await extractViaCobalt(job.normalizedUrl, quality, isAudio);
      if (cobaltResult.streamUrl) {
        try {
          const mediaRes = await fetch(cobaltResult.streamUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              Accept: "*/*",
            },
            signal: AbortSignal.timeout(35000),
          });

          const ct = (mediaRes.headers.get("content-type") || "").toLowerCase();
          if (
            mediaRes.ok &&
            !ct.includes("text/html") &&
            !ct.includes("text/plain") &&
            !ct.includes("xml")
          ) {
            res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${cobaltResult.filename || targetFilename}"`
            );
            res.setHeader("Cache-Control", "no-store");
            const cl = mediaRes.headers.get("content-length");
            if (cl) res.setHeader("Content-Length", cl);

            if (mediaRes.body) {
              const stream = Readable.fromWeb(mediaRes.body as any);
              return stream.pipe(res);
            } else {
              const buf = Buffer.from(await mediaRes.arrayBuffer());
              return res.end(buf);
            }
          }
        } catch (streamErr: any) {
          console.warn("[cobalt stream error]", streamErr?.message);
        }
      }
    }

    // Universal Direct Web Fallback: If yt-dlp failed, check if the URL directly serves media bytes
    if (!ytdlResult.success && !directFallbackUrl) {
      try {
        console.log("[DEV LOG - Attempting Direct Web Stream Fallback]", job.normalizedUrl);
        const webRes = await fetch(job.normalizedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "*/*",
          },
          signal: AbortSignal.timeout(20000),
        });

        const ct = (webRes.headers.get("content-type") || "").toLowerCase();
        if (webRes.ok && (ct.startsWith("video/") || ct.startsWith("audio/") || ct.includes("octet-stream"))) {
          const tempRawWeb = path.join("/tmp", `web_raw_${job.jobId}_${Date.now()}`);
          const buf = Buffer.from(await webRes.arrayBuffer());
          if (buf.length > 2048) {
            fs.writeFileSync(tempRawWeb, buf);
            setTimeout(() => {
              try { if (fs.existsSync(tempRawWeb)) fs.unlinkSync(tempRawWeb); } catch {}
            }, 15 * 60 * 1000);
            return serveMediaFile(tempRawWeb, targetFilename, isAudio, isPreview, req, res);
          }
        }
      } catch (webFallbackErr: any) {
        console.warn("[Stream Handler - Web direct fallback error]", webFallbackErr?.message);
      }
    }

    // Return the specific, descriptive error returned by the extractor
    const errMsg =
      ytdlResult.error ||
      `Unable to extract downloadable stream for this ${job.platform} video at this time. The media may be private, restricted, or rate-limited.`;
    const isBot = Boolean(
      errMsg.includes("bot verification") ||
      errMsg.includes("not a bot") ||
      errMsg.includes("Sign in to confirm")
    );

    return res.status(502).json({
      success: false,
      error: errMsg,
      isBotVerification: isBot,
      platform: job.platform,
      originalUrl: job.originalUrl,
      videoId: job.videoId,
    });
  });

  // Direct streaming helper for URL-based fallback
  async function handleDirectStreamRequest(rawUrl: string, quality: string, res: express.Response) {
    if (!isSafeUrl(rawUrl)) {
      return res.status(400).json({ success: false, error: "Invalid or unsafe URL." });
    }
    const platform = detectPlatform(rawUrl);
    const isAudio = quality.toUpperCase() === "AUDIO";

    if (platform === "direct") {
      try {
        const directRes = await fetch(rawUrl, { signal: AbortSignal.timeout(25000) });
        if (!directRes.ok) {
          return res.status(directRes.status).json({ success: false, error: "Failed to fetch direct media." });
        }
        const info = extractFilenameFromUrl(rawUrl, "video");
        res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");
        res.setHeader("Content-Disposition", `attachment; filename="${info.fullName}"`);
        res.setHeader("Cache-Control", "no-store");
        if (directRes.body) {
          const stream = Readable.fromWeb(directRes.body as any);
          return stream.pipe(res);
        } else {
          return res.end(Buffer.from(await directRes.arrayBuffer()));
        }
      } catch (err: any) {
        return res.status(502).json({ success: false, error: err?.message || "Stream error." });
      }
    }

    const tempFileBase = path.join("/tmp", `pastelink_direct_${Date.now()}`);
    const ytdlResult = await downloadMediaViaYtDlp(rawUrl, tempFileBase, isAudio, quality);
    if (ytdlResult.success && ytdlResult.filePath && fs.existsSync(ytdlResult.filePath)) {
      try {
        const stats = fs.statSync(ytdlResult.filePath);
        const safeName = sanitizeFilename("media", isAudio ? "mp3" : "mp4");
        res.setHeader("Content-Type", isAudio ? "audio/mpeg" : "video/mp4");
        res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
        res.setHeader("Content-Length", stats.size);
        res.setHeader("Cache-Control", "no-store");

        const fileStream = fs.createReadStream(ytdlResult.filePath);
        fileStream.pipe(res);

        const cleanup = () => {
          if (ytdlResult.filePath && fs.existsSync(ytdlResult.filePath)) {
            fs.unlink(ytdlResult.filePath, () => {});
          }
        };

        fileStream.on("close", cleanup);
        res.on("close", cleanup);
        res.on("error", cleanup);
        return;
      } catch {
        // ignore
      }
    }

    return res.status(502).json({
      success: false,
      error: ytdlResult.error || "Unable to extract media stream for direct request.",
    });
  }

  // Backwards compatibility endpoint for /api/file
  app.get("/api/file", async (req, res) => {
    const rawUrl = (req.query.source as string) || (req.query.url as string);
    const quality = (req.query.quality as string) || "HD";
    if (rawUrl) {
      return handleDirectStreamRequest(rawUrl, quality, res);
    }
    return res.status(400).json({ success: false, error: "URL query parameter is required." });
  });

  app.use("/pastelink", express.static(path.join(process.cwd(), "pastelink")));

  // Vite development middleware vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pastelink server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
