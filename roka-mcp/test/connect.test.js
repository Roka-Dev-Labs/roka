import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, test } from "node:test";
import { integrateMcp, SERVER_KEY } from "../lib/connect.js";

const API_KEY = "rk_live_test_key";
const CWD = "/tmp/roka-project";
const HOME = "/tmp/roka-home";

const EXPECTED_ENTRY = {
  command: "npx",
  args: ["-y", "roka-mcp", "serve"],
  env: { ROKA_API_KEY: API_KEY },
};

function notFound() {
  const err = new Error("ENOENT");
  err.code = "ENOENT";
  return err;
}

function mockFs(initial = {}) {
  const files = new Map(Object.entries(initial));
  const writes = [];
  const io = {
    async mkdir() {
      return undefined;
    },
    async readFile(filePath) {
      if (!files.has(filePath)) throw notFound();
      return files.get(filePath);
    },
    async writeFile(filePath, data) {
      const text = String(data);
      writes.push({ path: filePath, data: text });
      files.set(filePath, text);
    },
  };
  return { io, writes, files };
}

describe("MCP integrateMcp", () => {
  test("claude-code writes a valid mcpServers JSON object to the project .mcp.json", async () => {
    const expectedPath = join(CWD, ".mcp.json");
    const { io, writes } = mockFs({
      [expectedPath]: JSON.stringify({
        mcpServers: { other: { command: "echo", args: ["hi"] } },
        theme: "keep-me",
      }),
    });

    const result = await integrateMcp("claude-code", API_KEY, { cwd: CWD, home: HOME, fs: io });

    assert.equal(result.path, expectedPath);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, expectedPath);

    const written = JSON.parse(writes[0].data);
    assert.deepEqual(written.mcpServers[SERVER_KEY], EXPECTED_ENTRY);
    assert.deepEqual(written.mcpServers.other, { command: "echo", args: ["hi"] });
    assert.equal(written.theme, "keep-me");
    assert.equal(result.payload.mcpServers[SERVER_KEY].command, "npx");
  });

  test("cursor writes a valid mcpServers JSON object to ~/.cursor/mcp.json", async () => {
    const expectedPath = join(HOME, ".cursor", "mcp.json");
    const { io, writes } = mockFs({
      [expectedPath]: JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"] },
        },
      }),
    });

    const result = await integrateMcp("cursor", API_KEY, { cwd: CWD, home: HOME, fs: io });

    assert.equal(result.path, expectedPath);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, expectedPath);

    const written = JSON.parse(writes[0].data);
    assert.deepEqual(written.mcpServers[SERVER_KEY], EXPECTED_ENTRY);
    assert.equal(written.mcpServers.filesystem.command, "npx");
    assert.ok(!writes[0].path.includes(CWD));
  });

  test("codex appends a valid mcp_servers object to ~/.codex/config.toml without wiping other tables", async () => {
    const expectedPath = join(HOME, ".codex", "config.toml");
    const { io, writes } = mockFs({
      [expectedPath]: ['model = "gpt-5"', "", "[mcp_servers.other]", 'command = "echo"', 'args = ["ok"]', ""].join("\n"),
    });

    const result = await integrateMcp("codex", API_KEY, { cwd: CWD, home: HOME, fs: io });

    assert.equal(result.path, expectedPath);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, expectedPath);

    const payload = result.payload;
    assert.equal(typeof payload, "object");
    assert.deepEqual(payload.mcp_servers[SERVER_KEY], EXPECTED_ENTRY);
    JSON.parse(JSON.stringify(payload));

    const toml = writes[0].data;
    assert.match(toml, /model = "gpt-5"/);
    assert.match(toml, /\[mcp_servers\.other\]/);
    assert.match(toml, /\[mcp_servers\.roka-mcp\]/);
    assert.match(toml, /command = "npx"/);
    assert.match(toml, /args = \["-y", "roka-mcp", "serve"\]/);
    assert.match(toml, /ROKA_API_KEY = "rk_live_test_key"/);
  });

  test("copilot writes a valid servers JSON object to the project .vscode/mcp.json", async () => {
    const expectedPath = join(CWD, ".vscode", "mcp.json");
    const { io, writes } = mockFs({
      [expectedPath]: JSON.stringify({
        servers: { github: { type: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] } },
      }),
    });

    const result = await integrateMcp("copilot", API_KEY, { cwd: CWD, home: HOME, fs: io });

    assert.equal(result.path, expectedPath);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, expectedPath);

    const written = JSON.parse(writes[0].data);
    assert.deepEqual(written.servers[SERVER_KEY], { type: "stdio", ...EXPECTED_ENTRY });
    assert.equal(written.servers.github.command, "npx");
    assert.equal(result.payload.servers[SERVER_KEY].type, "stdio");
  });
});
