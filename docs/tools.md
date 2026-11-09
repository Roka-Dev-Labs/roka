# MCP tools

After a successful `serve`, the agent sees three tools. All run the same local prune pipeline. Default character budget is **4000**.

## prune_logs

Prune raw log text already in the conversation or tool arguments.

| Argument | Type | Description |
| --- | --- | --- |
| text | string, required | Raw log text to prune |
| budget | positive int, optional | Target character budget (default 4000) |
| query | string, optional | Task or question to score lines against |

## prune_file

Read a log file by path and prune it. Path may be absolute or relative to the server’s working directory.

| Argument | Type | Description |
| --- | --- | --- |
| path | string, required | Path to the log file |
| budget | positive int, optional | Target character budget (default 4000) |
| query | string, optional | Task or question to score lines against |

## prune_tail

Read a live log, keep the last N lines, then prune that slice.

| Argument | Type | Description |
| --- | --- | --- |
| path | string, required | Path to the log file |
| lines | positive int, optional | Trailing lines to read (default 200) |
| budget | positive int, optional | Target character budget (default 4000) |
| query | string, optional | Task or question to score lines against |

On success the tool returns JSON text with `prunedText`, `originalLines` / `prunedLines`, `originalChars` / `prunedChars`, and `kept` (each line with `reasons`: query, crash, neighbor, recency). On failure it returns an error string.

When the collapsed text still exceeds the budget, lines are packed in this order: query hits, then crash lines matching this regex (case-insensitive):

```
\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic)\b
```

then crash neighbors (±2 lines), then recency. Query outranks crash. Adjacent duplicate lines are collapsed to `line  (xN repeated)` before ranking.
