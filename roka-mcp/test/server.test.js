import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, SERVER_NAME, SERVER_VERSION } from "../lib/server.js";

const GOLD = "sshd: Bind to port 22: Address already in use";
const QUERY = "why did sshd fail to bind port";

function noisyLog() {
  return [
    ...Array.from({ length: 25 }, (_, i) => `INFO heartbeat ok ${i}`),
    GOLD,
    "sshd: exiting",
    ...Array.from({ length: 6 }, (_, i) => `INFO unrelated ${i}`),
    ...Array.from({ length: 40 }, (_, i) => `ERROR retry connection refused ${i}`),
  ].join("\n");
}

async function connectedPair() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  const client = new Client({ name: "roka-mcp-test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

function parseTool(result) {
  assert.equal(result.isError ?? false, false);
  assert.equal(result.content[0]?.type, "text");
  return JSON.parse(result.content[0].text);
}

describe("MCP server handshake and tools", () => {
  test("initialize, list tools, and prune_logs with a query", async () => {
    const { client, server } = await connectedPair();
    try {
      assert.equal(client.getServerVersion()?.name, SERVER_NAME);
      assert.equal(client.getServerVersion()?.version, SERVER_VERSION);

      const listed = await client.listTools();
      const names = listed.tools.map((tool) => tool.name).sort();
      assert.deepEqual(names, ["prune_file", "prune_logs", "prune_tail"]);

      const pruneLogs = listed.tools.find((tool) => tool.name === "prune_logs");
      assert.ok(pruneLogs.inputSchema?.properties?.query);
      assert.ok(listed.tools.find((tool) => tool.name === "prune_file").inputSchema?.properties?.query);
      assert.ok(listed.tools.find((tool) => tool.name === "prune_tail").inputSchema?.properties?.query);

      const payload = parseTool(
        await client.callTool({
          name: "prune_logs",
          arguments: { text: noisyLog(), budget: 280, query: QUERY },
        })
      );

      assert.equal(payload.mode, "pruned");
      assert.equal(payload.prunedText.includes(GOLD), true);
      assert.ok(payload.kept.some((row) => row.reasons.includes("query")));
      assert.ok(payload.queryTerms.includes("sshd"));
    } finally {
      await client.close();
      await server.close();
    }
  });

  test("prune_file and prune_tail accept query and keep the cause line", async () => {
    const dir = await mkdtemp(join(tmpdir(), "roka-mcp-"));
    const filePath = join(dir, "sshd.log");
    await writeFile(filePath, noisyLog(), "utf8");

    const { client, server } = await connectedPair();
    try {
      const fromFile = parseTool(
        await client.callTool({
          name: "prune_file",
          arguments: { path: filePath, budget: 280, query: QUERY },
        })
      );
      assert.equal(fromFile.prunedText.includes(GOLD), true);

      const fromTail = parseTool(
        await client.callTool({
          name: "prune_tail",
          arguments: { path: filePath, lines: 80, budget: 280, query: QUERY },
        })
      );
      assert.equal(fromTail.prunedText.includes(GOLD), true);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
