# MCP tools

After a successful `serve`, the agent sees three tools. All run the same local prune pipeline. Default character budget is **4000**.

## prune_logs

Prune raw log text already in the conversation or tool arguments.

| Argument | Type | Description |
| --- | --- | --- |
| text | string, required | Raw log text to prune |
| budget | positive int, optional | Target character budget (default 4000) |

## prune_file

Read a log file by path and prune it. Path may be absolute or relative to the server’s working directory.

| Argument | Type | Description |
| --- | --- | --- |
| path | string, required | Path to the log file |
| budget | positive int, optional | Target character budget (default 4000) |

## prune_tail

Read a live log, keep the last N lines, then prune that slice.

| Argument | Type | Description |
| --- | --- | --- |
| path | string, required | Path to the log file |
| lines | positive int, optional | Trailing lines to read (default 200) |
| budget | positive int, optional | Target character budget (default 4000) |

On success the tool returns JSON text with `prunedText`, `originalLines` / `prunedLines`, `originalChars` / `prunedChars`. On failure it returns an error string.

Crash / force-keep regex (case-insensitive):

```
\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic)\b
```
