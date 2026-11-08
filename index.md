# Roka

The right logs. Not the whole log.

Select the lines an AI agent needs from a noisy dump — crash evidence, query matches, packed to a budget. Local. Inspectable.

- Site: https://www.roka-prune.com/
- Docs: https://www.roka-prune.com/docs/
- Install: https://www.roka-prune.com/install.html
- Research: https://www.roka-prune.com/research.html
- Testing: https://www.roka-prune.com/testing.html
- OpenAPI: https://www.roka-prune.com/openapi.json
- MCP: https://www.roka-prune.com/.well-known/mcp-server
- Index: https://www.roka-prune.com/llms.txt
- Full dump: https://www.roka-prune.com/llms-full.txt

This URL also serves HTML. Agents should send `Accept: text/markdown` (this representation) to skip markup.

## Install CLI

```bash
curl -fsSL https://install.roka-prune.com | bash
```

Then prune stdin or a file:

```bash
cat deploy.log | roka prune --query "connection errors" --budget 8000
```

## Connect an MCP agent (Pro)

```bash
npx roka-mcp connect --agent <claude-code|cursor|codex|copilot|vscode|windsurf|cline> --api-key rk_live_...
```

Tools after `serve`: `prune_logs`, `prune_file`, `prune_tail`. Log text stays on the machine. Docs: https://www.roka-prune.com/docs/mcp.html

## How it works

1. Collapse adjacent duplicate / near-duplicate lines.
2. Score remaining lines against an optional query (whole-word terms). Crash lines pack first; a later ERROR that does not match the question can be dropped.
3. Pack into the requested character budget. If a protected line exceeds the budget it is kept whole and the overage is reported.

Same idea for CLI, MCP, and `POST https://api.roka-prune.com/api/prune`. MCP prune is inspectable: each kept line has a reason (query, crash, neighbor, recency).

## Free usage & limits

Roka is free with usage limits. No subscription or payment is required.

- Local CLI: 15K tokens lifetime per device; works offline without an account.
- Hosted API: up to 500K tokens per month, depending on your API key.
- MCP requires a valid API key with the appropriate access.

Check your dashboard for your current quota and remaining usage: https://www.roka-prune.com/dashboard.html
API keys: https://www.roka-prune.com/dashboard/api-keys.html

## More pages

- About: https://www.roka-prune.com/about.html
- Privacy: https://www.roka-prune.com/privacy.html
- Terms: https://www.roka-prune.com/terms.html
- Security: https://www.roka-prune.com/.well-known/security.txt
- CLI repo: https://github.com/Roka-Dev-Labs/roka
- MCP package: https://www.npmjs.com/package/roka-mcp
