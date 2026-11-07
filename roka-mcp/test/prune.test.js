import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CRASH_PATTERN,
  DEFAULT_BUDGET,
  pruneText,
  scoreLine,
  tokenizeQuery,
} from "../lib/prune.js";

function lines(...rows) {
  return rows.join("\n");
}

describe("tokenizeQuery", () => {
  test("is deterministic and drops stopwords", () => {
    const a = tokenizeQuery("Why did sshd fail to bind port?");
    const b = tokenizeQuery("why DID sshd fail to bind port");
    assert.deepEqual(a, ["bind", "fail", "port", "sshd"]);
    assert.deepEqual(a, b);
  });

  test("empty and non-string queries yield no terms", () => {
    assert.deepEqual(tokenizeQuery(""), []);
    assert.deepEqual(tokenizeQuery("   "), []);
    assert.deepEqual(tokenizeQuery(undefined), []);
  });
});

describe("pruneText collapse and passthrough", () => {
  test("collapses adjacent duplicates when the result fits", () => {
    const text = lines("INFO ok", "INFO ok", "INFO ok", "WARN once");
    const out = pruneText(text, 400);
    assert.equal(out.mode, "pruned");
    assert.match(out.prunedText, /INFO ok {2}\(x3 repeated\)/);
    assert.match(out.prunedText, /WARN once/);
    assert.equal(out.budgetExceeded, false);
  });

  test("passes binary input through unchanged", () => {
    const text = "INFO ok\0ERROR hidden";
    const out = pruneText(text, 20);
    assert.equal(out.mode, "passthrough");
    assert.equal(out.prunedText, text);
    assert.ok(out.warnings.some((w) => /NUL/.test(w)));
  });

  test("passes through when budget is unusable", () => {
    const text = "FATAL boom";
    const out = pruneText(text, 0);
    assert.equal(out.mode, "passthrough");
    assert.equal(out.prunedText, text);
  });

  test("passes non-string input through as empty", () => {
    const out = pruneText(null, 100);
    assert.equal(out.mode, "passthrough");
    assert.equal(out.prunedText, "");
  });

  test("empty input stays empty", () => {
    const out = pruneText("", 100);
    assert.equal(out.prunedText, "");
    assert.equal(out.originalLines, 0);
  });
});

describe("protected lines and truncation", () => {
  test("does not tail-slice an early crash line off the output", () => {
    const crash = "FATAL bind failed at startup";
    const recent = Array.from({ length: 40 }, (_, i) => `INFO heartbeat ${i}`);
    const text = lines(crash, ...recent);
    const budget = 180;
    const out = pruneText(text, budget);
    assert.match(out.prunedText, /FATAL bind failed at startup/);
    assert.equal(out.prunedText.includes(crash.slice(0, 12)), true);
    const naive = text.slice(-budget);
    assert.equal(naive.includes(crash), false);
  });

  test("keeps a small window around a crash line", () => {
    const text = lines(
      "INFO before-2",
      "INFO before-1",
      "panic: runtime error",
      "INFO after-1",
      "INFO after-2",
      ...Array.from({ length: 30 }, (_, i) => `TRACE filler ${i}`)
    );
    const out = pruneText(text, 160);
    assert.match(out.prunedText, /panic: runtime error/);
    assert.match(out.prunedText, /before-1/);
    assert.match(out.prunedText, /after-1/);
  });

  test("never character-slices a selected line to fake a fit", () => {
    const crash = "FATAL " + "x".repeat(80);
    const text = lines("INFO a", crash, "INFO b");
    const out = pruneText(text, crash.length - 10);
    assert.equal(out.prunedText.includes(crash), true);
    assert.equal(out.prunedText.includes(crash.slice(0, 40)) && !out.prunedText.includes(crash), false);
  });

  test("a crash line longer than the budget is kept whole and overage is reported", () => {
    const crash = "FATAL " + "payload=".repeat(400);
    assert.ok(crash.length > 2000);
    const text = lines("INFO start", crash, "INFO end");
    const budget = 400;
    const out = pruneText(text, budget);
    assert.equal(out.prunedText, crash);
    assert.equal(out.budgetExceeded, true);
    assert.equal(out.budgetOverageChars, crash.length - budget);
    assert.ok(out.warnings.some((w) => /budget exceeded/.test(w)));
    assert.ok(out.prunedText.startsWith("FATAL "));
    assert.equal(out.prunedText.endsWith("payload="), true);
  });

  test("omits extra protected lines that cannot fit as whole lines and reports them", () => {
    const a = "FATAL first-incident " + "A".repeat(50);
    const b = "FATAL second-incident " + "B".repeat(50);
    const c = "FATAL third-incident " + "C".repeat(50);
    const budget = a.length + 1 + b.length;
    const out = pruneText(lines(a, b, c), budget);
    assert.match(out.prunedText, /first-incident/);
    assert.match(out.prunedText, /second-incident/);
    assert.equal(out.prunedText.includes("third-incident"), false);
    assert.equal(out.budgetExceeded, false);
    assert.ok(out.protectedOmittedLines >= 1);
    assert.ok(out.protectedOmittedChars >= c.length);
    assert.ok(out.warnings.some((w) => /omitted/.test(w)));
    assert.ok(out.prunedChars <= budget);
  });

  test("default budget is 4000 characters", () => {
    const out = pruneText("INFO only");
    assert.equal(out.budget, DEFAULT_BUDGET);
  });
});

describe("query scoring is inspectable and beats recency", () => {
  test("scoreLine reports which terms matched", () => {
    const terms = tokenizeQuery("sshd bind port");
    const hit = scoreLine("sshd: Bind to port 22: Address already in use", terms);
    const miss = scoreLine("ERROR retry connection refused", terms);
    assert.ok(hit.score >= 2);
    assert.ok(hit.matchedTerms.includes("sshd"));
    assert.equal(miss.score, 0);
    assert.deepEqual(miss.matchedTerms, []);
  });

  test("query keeps a cause with no crash keyword and drops later ERROR spam", () => {
    const gold = "sshd: Bind to port 22: Address already in use";
    const misleading = "ERROR retry connection refused";
    const text = lines(
      ...Array.from({ length: 25 }, (_, i) => `INFO heartbeat ok ${i}`),
      gold,
      "sshd: exiting",
      ...Array.from({ length: 6 }, (_, i) => `INFO unrelated ${i}`),
      ...Array.from({ length: 40 }, (_, i) => `${misleading} ${i}`)
    );
    const budget = 280;
    const query = "why did sshd fail to bind port";
    const withQuery = pruneText(text, budget, { query });
    const recency = pruneText(text, budget);
    const tail = text.slice(-budget);

    assert.equal(withQuery.prunedText.includes(gold), true);
    assert.equal(tail.includes(gold), false);
    assert.equal(recency.prunedText.includes(gold), false);
    assert.equal(recency.prunedText.includes(misleading), true);

    const goldKept = withQuery.kept.find((k) => k.matchedTerms.includes("sshd"));
    assert.ok(goldKept);
    assert.ok(goldKept.reasons.includes("query"));
    assert.deepEqual(withQuery.queryTerms, tokenizeQuery(query));
    assert.ok(goldKept.score > 0);
  });

  test("CRASH_PATTERN does not fire on the gold sshd line", () => {
    assert.equal(CRASH_PATTERN.test("sshd: Bind to port 22: Address already in use"), false);
    assert.equal(CRASH_PATTERN.test("ERROR retry connection refused"), true);
  });
});
