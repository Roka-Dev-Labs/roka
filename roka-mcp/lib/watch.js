/**
 * roka-mcp watch — tail a log file and, on crash-pattern matches, prune the
 * recent context and write it to .roka/crash-context.txt (per README).
 *
 * Uses plain polling (fs.statSync + fs.readSync) rather than fs.watch so it
 * behaves consistently across platforms/filesystems and copes gracefully
 * with the target file not existing yet or being truncated/rotated.
 */

import { closeSync, existsSync, mkdirSync, openSync, readSync, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pruneText, DEFAULT_BUDGET, CRASH_PATTERN } from "./prune.js";

const MAX_BUFFER_LINES = 2000;
const POLL_INTERVAL_MS = 300;
const CRASH_COOLDOWN_MS = 1500;
const API_KEY_DASHBOARD_URL = "https://roka-prune.com/dashboard/api-keys.html";

function printWatchHelp() {
  console.error(`
Usage: roka-mcp watch <path> --on-crash [options]

Tails a log file. When --on-crash is set and a new line matches the crash
pattern (${CRASH_PATTERN.source}), prunes the recent buffered context and
writes it to .roka/crash-context.txt.

Options:
  --on-crash             Enable crash-triggered context pruning
  --budget <n>           Character budget for pruned output (default ${DEFAULT_BUDGET})
  --api-key, -k <key>    Roka Pro API key (or set ROKA_API_KEY)
  --help, -h             Show this help

Example:
  roka-mcp watch ./logs/dev.log --on-crash
`);
}

function parseWatchArgs(args) {
  const opts = { path: null, onCrash: false, budget: DEFAULT_BUDGET, apiKey: null };
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--on-crash") {
      opts.onCrash = true;
    } else if (arg === "--budget") {
      opts.budget = Number(args[++i]);
    } else if (arg.startsWith("--budget=")) {
      opts.budget = Number(arg.slice("--budget=".length));
    } else if (arg === "--api-key" || arg === "-k") {
      opts.apiKey = args[++i];
    } else if (arg.startsWith("--api-key=")) {
      opts.apiKey = arg.slice("--api-key=".length);
    } else if (arg === "--help" || arg === "-h") {
      printWatchHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    } else {
      console.error(`[roka-mcp] watch: unknown argument "${arg}"`);
      printWatchHelp();
      process.exit(1);
    }
  }
  opts.path = positional[0] || null;
  return opts;
}

export async function watchCommand(args) {
  const opts = parseWatchArgs(args);

  if (!opts.path) {
    console.error("[roka-mcp] watch: missing required <path>");
    printWatchHelp();
    process.exit(1);
  }
  if (!Number.isFinite(opts.budget) || opts.budget <= 0) {
    console.error("[roka-mcp] watch: --budget must be a positive number");
    process.exit(1);
  }

  const apiKey = opts.apiKey || process.env.ROKA_API_KEY || null;
  if (!apiKey) {
    console.error("[roka-mcp] watch: MCP is a Pro feature and requires an API key.");
    console.error(`  Set ROKA_API_KEY or pass --api-key <key>. Get one at ${API_KEY_DASHBOARD_URL}`);
    process.exit(1);
  }

  const targetPath = opts.path;
  const outDir = join(process.cwd(), ".roka");
  const outPath = join(outDir, "crash-context.txt");

  let buffer = [];
  let lastSize = 0;
  let lastCrashAt = 0;
  let partialLine = "";
  let stopped = false;

  try {
    lastSize = statSync(targetPath).size;
  } catch {
    lastSize = 0;
    console.error(`[roka-mcp] watch: "${targetPath}" does not exist yet — waiting for it to be created...`);
  }

  async function handleCrash(matchedLine) {
    const now = Date.now();
    if (now - lastCrashAt < CRASH_COOLDOWN_MS) return;
    lastCrashAt = now;

    const contextText = buffer.join("\n");
    const result = pruneText(contextText, opts.budget);
    try {
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const header =
        `# roka-mcp crash context — ${new Date().toISOString()}\n` +
        `# trigger: ${matchedLine.trim()}\n` +
        `# source: ${targetPath}\n\n`;
      await writeFile(outPath, header + result.prunedText + "\n", "utf8");
      console.error(
        `[roka-mcp] crash detected — wrote pruned context to ${outPath} ` +
          `(${result.prunedChars}/${result.originalChars} chars)`
      );
    } catch (err) {
      console.error(`[roka-mcp] watch: failed to write crash context: ${err.message}`);
    }
  }

  function readNewChunk() {
    let size;
    try {
      size = statSync(targetPath).size;
    } catch {
      return;
    }

    if (size < lastSize) {
      // File was truncated or rotated — start over from the top.
      lastSize = 0;
      buffer = [];
      partialLine = "";
    }
    if (size === lastSize) return;

    let fd;
    try {
      fd = openSync(targetPath, "r");
      const length = size - lastSize;
      const chunk = Buffer.alloc(length);
      readSync(fd, chunk, 0, length, lastSize);
      lastSize = size;

      const chunkText = partialLine + chunk.toString("utf8");
      const parts = chunkText.split("\n");
      partialLine = parts.pop() ?? "";

      for (const line of parts) {
        buffer.push(line);
        if (buffer.length > MAX_BUFFER_LINES) buffer.shift();
        if (opts.onCrash && CRASH_PATTERN.test(line)) {
          void handleCrash(line);
        }
      }
    } catch (err) {
      console.error(`[roka-mcp] watch: read error: ${err.message}`);
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }

  console.error(
    `[roka-mcp] watching ${targetPath}${opts.onCrash ? " (crash detection on)" : " (crash detection off)"}`
  );

  const interval = setInterval(readNewChunk, POLL_INTERVAL_MS);

  const shutdown = (signal) => {
    if (stopped) return;
    stopped = true;
    console.error(`[roka-mcp] received ${signal}, stopping watch`);
    clearInterval(interval);
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await new Promise(() => {});
}
