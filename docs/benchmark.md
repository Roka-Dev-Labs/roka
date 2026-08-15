# Benchmark

MVP study: the shipped MCP `prune_file` tool on the [LogHub](https://github.com/logpai/loghub) corpus. 15 real production log sources, one 4,000-character budget, no per-file tuning.

| Metric | Result |
| --- | --- |
| Avg. lines removed | 92.2% |
| Avg. compression | ~69× (chars in → 4K out) |
| Sources with real errors still surfaced | 11 / 11 |

This measures **retention under budget** — did the important line survive? It does not measure downstream agent task success, wall-clock RAG savings, or ranking quality vs embedding baselines.

Methodology: https://www.roka-prune.com/research.html — per-dataset table: https://www.roka-prune.com/testing.html
