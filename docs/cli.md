# CLI usage

The CLI reads logs from stdin or a file and writes pruned context to stdout or a file. It is model-agnostic: pipe the result into any agent.

```bash
cat deploy.log | roka prune --query "connection errors" --budget 8000
roka --input app.log --query "what broke during last night's deploy" --budget 12000
roka --input big.log --query "OOM" --budget 5000 --output pruned.txt
roka --input logs.txt --query "auth failures" --budget 8000 --api-key rk_live_...
```

| Flag | Default | Description |
| --- | --- | --- |
| `-q, --query` | summarize | What to focus on — plain English or keywords |
| `-b, --budget` | 8000 | Token budget for the output |
| `-i, --input` | stdin | Input file path |
| `-o, --output` | stdout | Output file path |
| `-a, --api-key` | — | API key (Pro). Semantic re-rank path. |

Exact flags can vary by release. Check `roka --help` on the binary you installed.

1. **Collapse** — adjacent duplicate / near-duplicate lines merge with counts.
2. **Rank / force-keep** — ERROR, FATAL, CRITICAL, Exception, Traceback, panic survive.
3. **Fit** — pack into your character/token budget.

Deterministic by default. Semantic re-ranking is Pro/optional. Local prune does not upload log contents. Free hosted quota is 15K tokens lifetime per device; the local binary still runs offline.
