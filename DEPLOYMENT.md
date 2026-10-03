# ClipVault Production Deployment & Architecture Guide

This document outlines high-availability deployment, scaling strategies, and media streaming architecture for **ClipVault**.

---

## 1. Quick Start (Local & Containerized)

### Local Development (Node.js + System Binaries)
```bash
# 1. Install System Dependencies
# Ubuntu / Debian:
sudo apt update && sudo apt install -y ffmpeg python3 curl

# macOS (Homebrew):
brew install ffmpeg

# 2. Install Project Dependencies
npm install

# 3. Start Development Server (Express with mounted Vite middleware)
npm run dev
# Open http://localhost:3000 in your browser
```

### Docker Compose (Recommended Production Setup)
```bash
docker compose up -d --build
docker compose logs -f clipvault-web
```

---

## 2. Handling Long-Running Connections & Server Timeouts

Downloading 4K video files or long audio streams can take minutes. Standard reverse proxies (Nginx, Cloudflare, Traefik, AWS ALB) default to 60-second timeouts.

### Reverse Proxy Configuration (Nginx)
Add these directives to your `/etc/nginx/sites-available/clipvault` location block:

```nginx
server {
    listen 80;
    server_name clipvault.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # Critical for Server-Sent Events (SSE) and live progress:
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        # Prevent timeouts during multi-gigabyte media downloads:
        proxy_connect_timeout 600s;
        proxy_send_timeout    600s;
        proxy_read_timeout    600s;
        send_timeout          600s;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. Storage Architecture: Ephemeral Disk vs. Object Storage (S3 / R2)

### Current Architecture (Local / Ephemeral Disk)
- Files are saved to `/tmp/clipvault-downloads/<taskId>/`.
- Streamed directly to the client via chunked `fs.createReadStream`.
- Auto-cleaned after 30 minutes via background timer.

### Scaled Architecture (Cloudflare R2 / AWS S3 Presigned URLs)
For multi-instance horizontal scaling (Kubernetes / ECS / Cloud Run):
1. **Worker Instance** downloads stream and streams directly into S3/R2 using multipart upload:
   ```typescript
   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
   ```
2. Worker sets a lifecycle policy (expire objects after 2 hours).
3. Backend generates an **Expiring Presigned Download URL** (e.g., valid for 15 minutes) and passes it to the client via SSE:
   ```json
   { "status": "ready", "downloadUrl": "https://r2.clipvault.app/exports/video.mp4?X-Amz-Signature=..." }
   ```
4. Client downloads directly from CDN edges, bypassing web server bandwidth bottlenecks.

---

## 4. Cobalt API Engine & Instance Configuration

ClipVault uses the modern, lightweight Cobalt API engine for media stream extraction.

### Production Configuration on Render:
1. **Cobalt Instance URL (`COBALT_API_URL`)**:
   Configure a self-hosted or dedicated Cobalt instance in your environment:
   ```bash
   COBALT_API_URL=https://your-cobalt-instance.com
   ```
2. **API Key (`COBALT_API_KEY`) - Optional**:
   If your Cobalt instance requires an API token:
   ```bash
   COBALT_API_KEY=your-api-key
   ```
3. **Proxy Support (`PROXY_URL`) - Optional**:
   If needed, configure an HTTP/SOCKS5 proxy:
   ```bash
   PROXY_URL=http://user:pass@residential.proxy-provider.com:8000
   ```

---

## 5. Security & SSRF Hardening

1. **Protocol Restriction**: Only `http:` and `https:` schemes allowed.
2. **SSRF IP Filtering**: Disallow loopback (`127.0.0.1`, `localhost`), link-local metadata (`169.254.169.254`), and RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
3. **Universal FastStart Processing**: Media streams are validated and normalized into standard FastStart H.264/AAC MP4 and MP3 containers via discrete child process execution.
