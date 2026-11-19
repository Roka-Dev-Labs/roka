# FAQ

## Why Soup instead of uploading to Claude?

File size: Claude limits uploads; Soup can take a local file of any size the OS can read. Cost: a huge log billed as LLM tokens is expensive; prune locally and send only the slice. Speed: local prune is typically hundreds of milliseconds. Local CLI keeps logs on the machine.

## Why not only semantic search / RAG?

Search finds chunks. Soup collapses adjacent identical and near-duplicate repeats, then packs query hits, crash lines, crash neighbors, and recency — keeping one representative of each template before extra copies of a storm. Default MCP tools use query scoring (stems, failure synonyms, logcat levels) plus crash detection (`ERROR`/`Exception` plus Android/Java forms), not embeddings.

## Does it work offline?

Yes. CLI and MCP prune run on your machine. No account and no API key.

## Do you store my logs?

Local CLI: logs stay on your machine. MCP tools prune in-process. We do not store, read, or transmit log file contents as a product feature. Account/usage metadata is separate — see [Privacy](https://trysoup.dev/docs/privacy.md).

## Which agents?

CLI stdout works with any model. MCP connect writes config for Claude Code, Cursor, Codex, Copilot, VS Code, Windsurf, and Cline. No API key required.

## Cost

Soup is free and open source (MIT). CLI and MCP have no device quota and no paid plan.

## Support

mailto:mukhamedjankydyrli@gmail.com · [CLI issues](https://github.com/Roka-Dev-Labs/roka/issues) · npm package `roka-mcp`.
