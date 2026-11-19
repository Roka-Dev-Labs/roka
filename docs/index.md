# Welcome to Soup

Soup is a free, open-source context-pruning layer for AI coding agents. It collapses adjacent duplicate and near-duplicate lines, ranks query / crash / neighbor / recency, and packs whole lines into a character budget without letting one crash storm fill it — before the model ever sees the dump.

Local prune tools do not upload your logs. MCP `connect` / `serve` / `watch` need no API key.

Point the CLI at a file or pipe stdin. Or connect an MCP-compatible agent so it can call `prune_file`, `prune_logs`, and `prune_tail` itself. Output is always the pruned context, not a summary written by a model.

```bash
cat deploy.log | roka prune --query "what broke" --budget 8000
```

- [Install the CLI](https://trysoup.dev/docs/install.md)
- [Connect an agent](https://trysoup.dev/docs/mcp.md)
- [CLI usage](https://trysoup.dev/docs/cli.md)
- [MCP tools](https://trysoup.dev/docs/tools.md)
- [How pruning works](https://trysoup.dev/docs/pipeline.md)
- [FAQ](https://trysoup.dev/docs/faq.md)
- [Free / open source](https://trysoup.dev/docs/pricing.md)
- [Benchmark](https://trysoup.dev/docs/benchmark.md)
- [Watch mode](https://trysoup.dev/docs/watch.md)
