# CLI usage

The CLI reads logs from stdin or a file and writes pruned context to stdout or a file. It is model-agnostic: pipe the result into any agent.

```bash
cat deploy.log | roka prune --query "connection errors" --budget 8000
roka --input app.log --query "what broke during last night's deploy" --budget 12000
roka --input big.log --query "OOM" --budget 5000 --output pruned.txt
```

| Flag | Default | Description |
| --- | --- | --- |
| `-q, --query` | summarize | What to focus on — plain English or keywords |
| `-b, --budget` | 8000 | Token budget for the output |
| `-i, --input` | stdin | Input file path |
| `-o, --output` | stdout | Output file path |

Exact flags can vary by release. Check `roka --help` on the binary you installed.

1. **Collapse** — adjacent identical lines merge with counts.
2. **Rank** — pack query hits, then crash lines, then crash neighbors, then recency. Query outranks an unrelated ERROR.
3. **Pack** — keep whole lines in a character budget. MCP default is 4000 characters; CLI `--budget` is tokens — see `roka --help`.

Deterministic by default. Local prune does not upload log contents. Soup is free: no device quota and no API key.
