# Bgern - Amharic Video Caption Studio

Deterministic server-side video caption burning and transcription platform powered by Next.js, native FFmpeg, and Noto Sans Ethiopic typography.

---

## Architecture Overview

1. **Deterministic Server-Side Export (`/api/export`)**:
   - Replaces in-browser canvas recording with native server-side FFmpeg.
   - Eliminates player freezes (e.g. in VLC, Windows Media Player) and variable frame rate (VFR) stuttering.
   - Converts caption data to styled Advanced SubStation Alpha (ASS) subtitles.
   - Burns in subtitles with the FFmpeg `subtitles` filter with `fontsdir` pointing to bundled Noto Sans Ethiopic fonts (`NotoSansEthiopic-Bold.ttf`, `NotoSansEthiopic-Regular.ttf`, and `NotoSans-Regular.ttf`).
   - Streams real-time encoding progress to the client via Server-Sent Events (SSE).
   - Enforces strict post-export validation (`ffprobe` and `freezedetect`) to ensure constant frame rate (CFR 30fps), H.264/AAC audio-video alignment, and no introduced playback freezes.

2. **Quality Options**:
   - **`original`**: Keeps the source resolution (rounded to even dimensions, capped at 1080p-class limits).
   - **`1080p`**: Output short side = 1080 (1920x1080 landscape, 1080x1920 portrait).
   - **`720p`**: Output short side = 720 (1280x720 landscape, 720x1280 portrait).
   - Never upscales: if the source is smaller than target, source size is preserved.

---

## Running with Docker (Recommended)

The provided multi-stage `Dockerfile` installs native `ffmpeg`, `libass9`, `fontconfig`, and Google Noto fonts, sets up the font cache, builds the Next.js production bundle, and starts the server.

### 1. Build the Docker Image

```bash
docker build -t bgern-captions:latest .
```

### 2. Run the Container

```bash
docker run -d \
  -p 3000:3000 \
  --name bgern-app \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  bgern-captions:latest
```

The app will be accessible at `http://localhost:3000`.

---

## Running on a Linux VPS / Dedicated Server

### 1. Install System Prerequisites

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y ffmpeg libass9 fontconfig fonts-noto-core fonts-noto-extra

# Update font cache
sudo fc-cache -f -v
```

Verify FFmpeg has libass enabled:
```bash
ffmpeg -version | grep -E "libass|fontconfig"
```

### 2. Install Node Dependencies & Build

```bash
npm install
npm run build
```

### 3. Run Production Server

```bash
# Using PM2 or Node
pm2 start server.js --name "bgern-captions"
```

---

## Export Validation Pipeline

Every export passes through `src/lib/video-validation.ts`:
- **Video Stream**: H.264 codec, `yuv420p` pixel format, constant frame rate (`r_frame_rate == avg_frame_rate`).
- **Audio Stream**: AAC codec, stereo 44.1kHz.
- **Audio/Video Sync**: Duration difference between audio and video streams must be `< 0.1s`.
- **Freeze Detection**: Runs `freezedetect=n=0.003:d=1` to ensure no freeze $\ge 1\text{s}$ was introduced by the rendering pipeline.

---

## File Structure

```
├── Dockerfile                      # Production Dockerfile with FFmpeg & Noto fonts
├── public/
│   └── fonts/                      # Bundled Noto Sans Ethiopic fonts
│       ├── NotoSansEthiopic-Bold.ttf
│       ├── NotoSansEthiopic-Regular.ttf
│       └── NotoSans-Regular.ttf
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── export/
│   │   │       └── route.ts        # Server-side export API with SSE progress
│   │   └── studio/
│   │       └── page.tsx            # Studio UI with quality selector, progress, & download
│   └── lib/
│       ├── ass-subtitles.ts        # ASS subtitle generator with Ethiopic typography
│       └── video-validation.ts     # Post-export ffprobe and freezedetect verification
```
