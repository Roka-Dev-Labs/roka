/**
 * roka-mcp — MCP server over stdio.
 *
 * Registers the three tools documented in README.md (prune_logs, prune_file,
 * prune_tail), which locally prune noisy logs: collapse repeats, keep
 * error/exception lines, and pack the result into a character budget.
 */

import { readFileSync } from "node:fs";
import { readFile as readFileAsync } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pruneText, DEFAULT_BUDGET } from "./prune.js";
import { verifyProAccess, printVerificationError } from "./verify.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));

export const SERVER_NAME = "roka-mcp";
export const SERVER_VERSION = pkg.version;

function textResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

function errorResult(message) {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export function createServer() {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "prune_logs",
    {
      title: "Prune log text",
      description:
        "Prune raw log text: collapse repeated lines, keep error/exception lines, pack to a character budget.",
      inputSchema: {
        text: z.string().describe("Raw log text to prune"),
        budget: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(`Target character budget (default ${DEFAULT_BUDGET})`),
      },
    },
    async ({ text, budget }) => {
      try {
        return textResult(pruneText(text, budget ?? DEFAULT_BUDGET));
      } catch (err) {
        return errorResult(`prune_logs failed: ${err.message}`);
      }
    }
  );

  server.registerTool(
    "prune_file",
    {
      title: "Prune a log file",
      description: "Read a log file by path and prune it to a character budget.",
      inputSchema: {
        path: z.string().describe("Absolute or relative path to the log file"),
        budget: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(`Target character budget (default ${DEFAULT_BUDGET})`),
      },
    },
    async ({ path, budget }) => {
      try {
        const text = await readFileAsync(path, "utf8");
        return textResult(pruneText(text, budget ?? DEFAULT_BUDGET));
      } catch (err) {
        return errorResult(`prune_file failed for "${path}": ${err.message}`);
      }
    }
  );

  server.registerTool(
    "prune_tail",
    {
      title: "Prune the tail of a log file",
      description:
        "Read the last N lines of a live log file and prune them to a character budget.",
      inputSchema: {
        path: z.string().describe("Absolute or relative path to the log file"),
        lines: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Number of trailing lines to read (default 200)"),
        budget: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(`Target character budget (default ${DEFAULT_BUDGET})`),
      },
    },
    async ({ path, lines, budget }) => {
      try {
        const text = await readFileAsync(path, "utf8");
        const tailLineCount = lines ?? 200;
        const tail = text.split("\n").slice(-tailLineCount).join("\n");
        return textResult(pruneText(tail, budget ?? DEFAULT_BUDGET));
      } catch (err) {
        return errorResult(`prune_tail failed for "${path}": ${err.message}`);
      }
    }
  );

  return server;
}

export async function serve() {
  const verification = await verifyProAccess(process.env.ROKA_API_KEY);
  if (!verification.ok) {
    printVerificationError("serve", verification);
    console.error(
      "[roka-mcp] refusing to start: MCP tools are a Pro feature and require a verified API key."
    );
    process.exit(1);
  }
  console.error(`[roka-mcp] verified Pro access (tier "${verification.tier}") — starting tools.`);

  if (process.stdin.isTTY) {
    console.error(`[roka-mcp] v${SERVER_VERSION} — starting MCP server on stdio.`);
    console.error(
      "[roka-mcp] This binary is meant to be launched by an MCP-compatible agent " +
        "(Claude Code, Cursor, Codex, ...), not run directly in an interactive terminal."
    );
    console.error("[roka-mcp] To register it with an agent, run: npx roka-mcp connect --agent <name>");
    console.error("[roka-mcp] Waiting for JSON-RPC on stdin... press Ctrl+C to exit.");
  }

  const server = createServer();
  const transport = new StdioServerTransport();

  const shutdown = async (signal) => {
    console.error(`[roka-mcp] received ${signal}, shutting down`);
    try {
      await server.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("uncaughtException", (err) => {
    console.error("[roka-mcp] uncaught exception:", err);
  });
  process.on("unhandledRejection", (err) => {
    console.error("[roka-mcp] unhandled rejection:", err);
  });

  await server.connect(transport);
  console.error(`[roka-mcp] MCP server v${SERVER_VERSION} listening on stdio`);
}
