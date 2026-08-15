# Watch mode

`roka-mcp watch` tails a log file. With `--on-crash`, a new line matching the crash pattern triggers the same prune pipeline used by the MCP tools. Pro API key required.

```bash
npx roka-mcp watch ./logs/dev.log --on-crash --api-key rk_live_...
```

| Flag | Description |
| --- | --- |
| `<path>` | Required. Log file to tail. If missing, watch waits for it. |
| `--on-crash` | Enable crash-triggered pruning |
| `--budget <n>` | Character budget (default 4000) |
| `--api-key`, `-k` | Pro API key, or `ROKA_API_KEY` |

On crash: a new line matches ERROR, FATAL, CRITICAL, Exception, Traceback, or panic; watch prunes recent buffered context; result is written to `.roka/crash-context.txt` with a timestamp header. Runs until Ctrl+C / SIGTERM. Without a verified Pro key, watch refuses to start.
