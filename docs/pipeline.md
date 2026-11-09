# How pruning works

The pipeline is deterministic. The MCP implementation lives in `roka-mcp/lib/prune.js` and is reused by tools and watch. The homepage playground runs the same file.

## 1. Collapse

The file is split on newlines. Adjacent identical lines merge. A line seen 128 times in a row becomes one line plus `(x128 repeated)`.

## 2. Rank

If the collapsed text still fits the budget, that is the output. If not, lines are packed in this order:

1. **query** — whole-word matches on query terms (length ≥ 3, stopwords stripped)
2. **crash** — `\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic)\b`
3. **neighbor** — lines within two rows of a crash line
4. **recency** — later lines before earlier ones inside a bucket

Query outranks crash. An unrelated ERROR is omitted when the question has already filled the budget.

## 3. Pack

Selected lines are kept whole and then re-sorted into original order. A line is never character-sliced. If a single protected line is longer than the budget, it is kept whole and the overage is reported. Later protected lines that do not fit are omitted and counted.

MCP default budget: **4000 characters**. CLI examples on this site often use `--budget 8000` in **tokens** — different unit, different binary. Check `roka --help`. The research write-up used a 4,000-character budget on LogHub.

Pruning (`prune_logs` / `prune_file` / `prune_tail` / `watch --on-crash`) runs in-process. Log text does not leave the machine for those tools. MCP still makes a one-time Pro verification request to `api.roka-prune.com` with the API key only.
