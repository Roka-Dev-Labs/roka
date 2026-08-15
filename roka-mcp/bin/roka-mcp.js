#!/usr/bin/env node
/**
 * roka-mcp — MCP integration for Roka.
 *
 * Commands:
 *   roka-mcp [serve]                        Start the MCP server on stdio (default)
 *   roka-mcp connect --agent <name> [opts]  Register roka-mcp with an AI agent
 *   roka-mcp watch <path> --on-crash [opts] Tail a log file, prune on crash
 *   roka-mcp --help | -h                    Show usage
 *   roka-mcp --version | -v                 Show version
 */

import { serve, SERVER_VERSION } from "../lib/server.js";
import { connectCommand, AGENTS } from "../lib/connect.js";
import { watchCommand } from "../lib/watch.js";

const COMMANDS = ["serve", "connect", "watch"];

function printHelp() {
  console.log(`
roka-mcp v${SERVER_VERSION} — MCP server for Roka log pruning

Usage:
  roka-mcp [serve]                          Start the MCP server on stdio (default)
  roka-mcp connect --agent <name> [opts]    Register roka-mcp with an AI agent
  roka-mcp watch <path> --on-crash [opts]   Tail a log file, prune on crash
  roka-mcp --help, -h                       Show this help
  roka-mcp --version, -v                    Show version

Agents supported by connect:
  ${Object.keys(AGENTS).join(", ")}

Examples:
  npx roka-mcp@latest
  npx roka-mcp connect --agent cursor --api-key rk_live_...
  npx roka-mcp watch ./logs/dev.log --on-crash

Run "roka-mcp <command> --help" for command-specific options.
Docs: https://roka-prune.com/docs/
`);
}

function printVersion() {
  console.log(SERVER_VERSION);
}

function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === "serve") {
    return serve();
  }
  if (command === "connect") {
    return connectCommand(rest);
  }
  if (command === "watch") {
    return watchCommand(rest);
  }
  if (command === "--help" || command === "-h" || command === "help") {
    printHelp();
    return;
  }
  if (command === "--version" || command === "-v") {
    printVersion();
    return;
  }

  console.error(`[roka-mcp] unknown command "${command}"`);
  console.error(`Available commands: ${COMMANDS.join(", ")}`);
  console.error(`Run "roka-mcp --help" for usage.`);
  process.exit(1);
}

Promise.resolve()
  .then(main)
  .catch((err) => {
    console.error("[roka-mcp] fatal error:", err);
    process.exit(1);
  });
