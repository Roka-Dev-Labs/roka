# How pruning works

The pipeline is deterministic. The MCP implementation lives in `roka-mcp/lib/prune.js` and is reused by tools and watch.

## 1. Collapse

The file is split on newlines. Adjacent identical lines merge. A line seen 128 times in a row becomes one line plus `(x128 repeated)`.

## 2. Force-keep

If the collapsed text still fits the budget, that is the output. If not, lines matching this crash regex are collected first:

```
ERROR | FATAL | CRITICAL | Exception | Traceback | panic
```

Those lines are never dropped to make room for chatter.

## 3. Fit

Remaining budget is filled from the **end** of the file (newest non-error lines), then re-sorted into original order. If still over budget, it is sliced from the end to the exact character cap.

MCP default budget: **4000 characters**. CLI examples often use **8000 tokens** — check `roka --help`. The research write-up used a 4,000-character budget on LogHub.

Pruning (`prune_logs` / `prune_file` / `prune_tail` / `watch --on-crash`) runs in-process. Log text does not leave the machine for those tools. MCP still makes a one-time Pro verification request to `api.roka-prune.com` with the API key only.
