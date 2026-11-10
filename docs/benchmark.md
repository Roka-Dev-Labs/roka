# Benchmark

10 Nov 2026 rerun of shipped `pruneText` (`prune_file(path, budget=4000)`, no query) on the [LogHub](https://github.com/logpai/loghub) 2k samples. 15 sources, 30,003 lines / 4,178,984 characters. Zookeeper excluded.

| Metric | Result |
| --- | --- |
| Mean lines removed | 98.3% |
| Character compression | 70× (4.18M → 59.7K) |
| Files with a crash-regex line that still had one | 11 / 11 |

This measures **retention under budget** — line removal, and whether a line matching `ERROR|FATAL|CRITICAL|Exception|Traceback|panic` survived a 4,000-character pack. It does not prove the tool finds the right evidence for arbitrary questions, or that agents debug better with the slice. This run passed no query.

Methodology: https://www.roka-prune.com/research.html — per-dataset table: https://www.roka-prune.com/testing.html
