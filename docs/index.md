# Welcome to Roka

Roka is a context-pruning layer for AI coding agents. It collapses noisy logs, force-keeps real errors, and packs the result into a token budget — before the model ever sees the dump.

Local prune tools do not upload your logs. MCP `connect` / `serve` / `watch` only call the API to verify a Pro key.

Point the CLI at a file or pipe stdin. Or connect an MCP-compatible agent so it can call `prune_file`, `prune_logs`, and `prune_tail` itself. Output is always the pruned context, not a summary written by a model.

```bash
cat deploy.log | roka prune --query "what broke" --budget 8000
```

- [Install the CLI](https://www.roka-prune.com/docs/install.md)
- [Connect an agent](https://www.roka-prune.com/docs/mcp.md)
- [CLI usage](https://www.roka-prune.com/docs/cli.md)
- [MCP tools](https://www.roka-prune.com/docs/tools.md)
- [How pruning works](https://www.roka-prune.com/docs/pipeline.md)
- [FAQ](https://www.roka-prune.com/docs/faq.md)
- [Pricing](https://www.roka-prune.com/docs/pricing.md)
- [Benchmark](https://www.roka-prune.com/docs/benchmark.md)
- [Watch mode](https://www.roka-prune.com/docs/watch.md)
