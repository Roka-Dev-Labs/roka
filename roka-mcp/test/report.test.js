import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { pruneText } from "../lib/prune.js";
import { eventFromPrune } from "../lib/report.js";

const GOLD = "sshd: Bind to port 22: Address already in use";

describe("MCP dashboard event payload", () => {
  test("sends process stats without log text or a full path", () => {
    const text = [
      ...Array.from({ length: 20 }, (_, i) => `INFO heartbeat ok ${i}`),
      GOLD,
      "ERROR retry connection refused",
    ].join("\n");
    const result = pruneText(text, 180, { query: "why did sshd fail to bind port" });
    const event = eventFromPrune("prune_file", result, {
      query: "why did sshd fail to bind port",
      file: "/var/log/auth/sshd.log",
    });

    assert.equal(event.tool, "prune_file");
    assert.equal(event.file, "sshd.log");
    assert.equal(event.query.includes("sshd"), true);
    assert.ok(event.originalLines > event.prunedLines || event.mode === "pruned");
    assert.ok(event.reasons.crash >= 1 || event.reasons.query >= 1);
    assert.equal("prunedText" in event, false);
    assert.equal("kept" in event, false);
    assert.equal("text" in event, false);
    assert.equal(JSON.stringify(event).includes(GOLD), false);
    assert.equal(JSON.stringify(event).includes("/var/log"), false);
  });
});
