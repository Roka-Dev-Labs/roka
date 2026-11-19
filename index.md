# Soup

The right logs. Not the whole log.

Select the lines an AI agent needs from a noisy dump — crash evidence, query matches, packed to a budget. Local. Inspectable. Free. MIT.

- Site: https://trysoup.dev/
- Docs: https://trysoup.dev/docs/
- Install: https://trysoup.dev/install.html
- Research: https://trysoup.dev/research.html
- Testing: https://trysoup.dev/testing.html
- MCP: https://trysoup.dev/.well-known/mcp-server
- Index: https://trysoup.dev/llms.txt
- Full dump: https://trysoup.dev/llms-full.txt

This URL also serves HTML. Agents should send `Accept: text/markdown` (this representation) to skip markup.

## Install CLI

```bash
curl -fsSL https://install.trysoup.dev | bash
```

Then prune stdin or a file:

```bash
cat deploy.log | roka prune --query "connection errors" --budget 8000
```

## Connect an MCP agent

Free. No API key.

```bash
npx roka-mcp connect --agent <claude-code|cursor|codex|copilot|vscode|windsurf|cline>
```

Tools after `serve`: `prune_logs`, `prune_file`, `prune_tail`. Log text stays on the machine. Docs: https://trysoup.dev/docs/mcp.html

## How it works

1. Collapse adjacent identical lines.
2. Pack remaining lines in order: query hits, crash lines, crash neighbors, recency. Query outranks an unrelated ERROR.
3. Pack into the requested character budget. If a protected line exceeds the budget it is kept whole and the overage is reported.

Same idea for CLI and MCP. MCP prune is inspectable: each kept line has a reason (query, crash, neighbor, recency).

## Free and open source

Soup is MIT-licensed. CLI and MCP are free, with no device quota and no paid plan.

## More pages

- Privacy: https://trysoup.dev/privacy.html
- Terms: https://trysoup.dev/terms.html
- Security: https://trysoup.dev/.well-known/security.txt
- CLI repo: https://github.com/Roka-Dev-Labs/roka
- MCP package: https://www.npmjs.com/package/roka-mcp
