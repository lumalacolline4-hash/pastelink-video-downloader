# syntax=docker/dockerfile:1.4
# Stage 1: Build Frontend Assets
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime system packages: FFmpeg, Python3, and Curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install standalone yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Verify binaries
RUN yt-dlp --version && ffmpeg -version

# Setup app directory & non-root user for security
RUN groupadd -r clipvault && useradd -r -g clipvault -m -d /home/clipvault clipvault
RUN chmod 1777 /tmp

# Copy dependency manifests and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend assets, backend server code, and static directories from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/pastelink ./pastelink

# Ensure proper permissions
RUN chown -R clipvault:clipvault /app

USER clipvault

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

CMD ["npx", "tsx", "server.ts"]
