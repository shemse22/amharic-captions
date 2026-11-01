# ==============================================================================
# Production Dockerfile for Bgern Amharic AI Captions
# Deterministic server-side video rendering with native FFmpeg and Ethiopic fonts
# ==============================================================================

FROM node:20-bookworm-slim AS base

# Install system dependencies: native ffmpeg, fontconfig, and Noto fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libass9 \
    fontconfig \
    fonts-noto-core \
    fonts-noto-extra \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies layer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder layer
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy bundled Amharic fonts to system font store and refresh fontconfig cache
RUN mkdir -p /usr/share/fonts/truetype/noto \
    && cp -r public/fonts/* /usr/share/fonts/truetype/noto/ 2>/dev/null || true \
    && fc-cache -f -v

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV FFMPEG_PATH="/usr/bin/ffmpeg"
ENV FFPROBE_PATH="/usr/bin/ffprobe"

# Copy fonts to runner image font cache
RUN mkdir -p /usr/share/fonts/truetype/noto
COPY --from=builder /app/public/fonts /usr/share/fonts/truetype/noto
RUN fc-cache -f -v

# Create uploads and temp directories
RUN mkdir -p public/uploads/.temp && chmod -R 777 public/uploads

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/data ./data

EXPOSE 3000

CMD ["node", "server.js"]
