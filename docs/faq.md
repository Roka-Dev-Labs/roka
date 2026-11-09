# FAQ

## Why Roka instead of uploading to Claude?

File size: Claude limits uploads; Roka can take a local file of any size the OS can read. Cost: a huge log billed as LLM tokens is expensive; prune locally and send only the slice. Speed: local prune is typically hundreds of milliseconds. Local CLI keeps logs on the machine.

## Why not only semantic search / RAG?

Search finds chunks. Roka collapses adjacent identical repeats, then packs query hits, crash lines, crash neighbors, and recency. Default MCP tools use whole-word query scoring + the crash regex, not embeddings. Semantic re-rank is a Pro/optional path on the hosted product, not the MCP default.

## Does it work offline?

Yes for the Free CLI prune path. Pro API and MCP verification need the network.

## Do you store my logs?

Local CLI: logs stay on your machine. MCP tools prune in-process. We do not store, read, or transmit log file contents as a product feature. Account/usage metadata is separate — see [Privacy](https://www.roka-prune.com/docs/privacy.md).

## Which agents?

CLI stdout works with any model. MCP connect writes config for Claude Code, Cursor, Codex, Copilot, VS Code, Windsurf, and Cline.

## Quotas

Free CLI prune: 15K tokens lifetime per device, no MCP. Pro / trial / Enterprise: 500K tokens per month and MCP access. MCP free-tier keys are rejected.

## Support

mailto:mukhamedjankydyrli@gmail.com · [CLI issues](https://github.com/Roka-Dev-Labs/roka/issues) · npm package `roka-mcp`.
