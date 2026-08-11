# Feature demo videos

Drop compressed `.mp4` files here. The Features bento cards look for:

| File | Card |
|---|---|
| `log-compaction.mp4` | 01 Log compaction |
| `critical-preservation.mp4` | 02 Critical preservation |
| `bm25-semantic-rank.mp4` | 03 BM25 + semantic rank |
| `token-budget-packer.mp4` | 04 Token budget packer |
| `multi-format-input.mp4` | 05 Multi-format input |
| `api-cli.mp4` | 06 API & CLI |
| `natural-language-queries.mp4` | 07 Natural language queries |

**Size:** keep each under ~15–25 MB (GitHub hard limit is 100 MB). Example:

```bash
ffmpeg -i "Log Compaction Video.mp4" \
  -vf "scale=-2:720" -c:v libx264 -crf 28 -preset medium \
  -an -movflags +faststart media/log-compaction.mp4
```
