# Video Generation — ShiputzAI Virtual Tour

## Overview
Generate smooth walkthrough videos between room visualizations using Veo 3.1.

## API: Replicate (google/veo-3.1)
- **Version:** `ed5b1767b711dd15d954b162af1e890d27882680f463a85e94f02d604012b972`
- **Cost:** ~$2-3 per 6s video
- **Generation time:** ~100-120 seconds
- **Output:** Always 1080p (1920x1080), H.264, ~17Mbps, ~12-13MB per 6s

## Input Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| `duration` | 6 | Minimum. Also supports 8, 10 |
| `aspect_ratio` | "16:9" | |
| `image` | base64 jpeg | First frame (room A) |
| `last_frame` | base64 jpeg | Last frame (room B) |
| `generate_audio` | false | Default |
| `resolution` | N/A | Veo always outputs 1080p |

## Prompt Template
```
Smooth continuous single-take camera dolly shot walking forward from a [ROOM_A] through a doorway into the [ROOM_B]. No cuts, no transitions, no scene changes. Steady forward movement, natural warm lighting, photorealistic residential interior.
```

## Problem: File Size
Veo outputs ~12-13MB for 6 seconds (1080p, 17Mbps).
Too large for user-facing product.

### Option A: ffmpeg post-processing (current)
```bash
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -crf 28 -preset fast output.mp4
```
Result: 12.6MB → 1.4MB. But adds server-side processing dependency.

### Option B: Use veo-3.1-fast
Possibly lower quality/bitrate? Need to test.

### Option C: Client-side resolution
Serve original, let browser handle it. Bad UX on mobile.

### Option D: Pre-compress on Replicate webhook
Use Replicate webhook → server receives URL → download + compress + store in Supabase storage.

## Credentials
- Replicate token: `/home/ubuntu/clawd/config/replicate-credentials.json`
- Gemini (for room images): `/home/ubuntu/clawd/config/gemini-credentials.json`

## Test Results
| Date | Model | First+Last | Resolution | Size | Time | Quality |
|------|-------|-----------|------------|------|------|---------|
| 2026-03-06 | veo-3.1 | No | 1080p | 20MB | 114s | Good but no room transition |
| 2026-03-07 | veo-3.1 | Yes | 1080p→720p | 12.6→1.4MB | 106s | Good transition |
