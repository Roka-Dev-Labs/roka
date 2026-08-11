# Feature demo media

Compressed from the master source `Log Compaction Video.mp4` (gitignored).

```bash
ffmpeg -i "Log Compaction Video.mp4" \
  -vf "scale=-2:720" -c:v libx264 -pix_fmt yuv420p -crf 26 -preset medium \
  -an -movflags +faststart media/log-compaction.mp4

ffmpeg -i "Log Compaction Video.mp4" -ss 00:00:02 -frames:v 1 -update 1 \
  -vf "scale=1280:-2" -q:v 4 media/log-compaction-poster.jpg
```
