# Benchmark

MVP study: the shipped MCP `prune_file` tool on the [LogHub](https://github.com/logpai/loghub) corpus. 15 real production log sources, one 4,000-character budget, no per-file tuning.

| Metric | Result |
| --- | --- |
| Avg. lines removed | 92.2% |
| Avg. compression | ~69× (chars in → 4K out) |
| Sources with real errors still surfaced | 11 / 11 |

This measures **retention under budget** — did a real error line survive a 4,000-character pack? It proves compression and error retention. It does not prove the tool finds the right evidence for arbitrary questions, or that agents debug better with the slice.

Methodology: https://www.roka-prune.com/research.html — per-dataset table: https://www.roka-prune.com/testing.html
