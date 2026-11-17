import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CRASH_PATTERN,
  DEFAULT_BUDGET,
  adjacentKey,
  diversityKey,
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

  test("collapses adjacent timestamped copies of the same crash", () => {
    const text = lines(
      "ERROR 2024-01-02T03:04:05.000Z boom id=0xabc",
      "ERROR 2024-01-02T03:04:06.111Z boom id=0xabc",
      "ERROR 2024-01-02T03:04:07.222Z boom id=0xabc",
      "INFO ok"
    );
    const out = pruneText(text, 400);
    assert.match(out.prunedText, /x3 repeated/);
    assert.equal(out.prunedText.split("\n").filter((row) => row.includes("boom")).length, 1);
    assert.equal(
      adjacentKey("ERROR 2024-01-02T03:04:05.000Z boom id=0xabc"),
      adjacentKey("ERROR 2024-01-02T03:04:06.111Z boom id=0xabc")
    );
  });

  test("does not collapse adjacent heartbeats that only differ by a small counter", () => {
    const text = lines("INFO heartbeat 0", "INFO heartbeat 1", "INFO heartbeat 2");
    const out = pruneText(text, 400);
    assert.equal(out.prunedText.includes("x3 repeated"), false);
    assert.match(out.prunedText, /heartbeat 0/);
    assert.match(out.prunedText, /heartbeat 1/);
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

describe("repeated crash storms leave room for other failures", () => {
  test("timestamped TLB copies collapse and do not starve a later APP FATAL", () => {
    const node = "R30-M0-N9-C:J16-U01";
    const tlb = Array.from({ length: 60 }, (_, i) => {
      const unix = 1118536327 + i * 10;
      const sec = String(i).padStart(2, "0");
      const frac = String(100000 + i).slice(1);
      return `KERNDTLB ${unix} 2005.06.11 ${node} 2005-06-11-17.32.${sec}.${frac} ${node} RAS KERNEL FATAL data TLB error interrupt`;
    });
    const other = [
      "APPREAD 1117869872 2005.06.04 R04-M1-N4-I:J18-U11 2005-06-04-00.24.32.432192 R04-M1-N4-I:J18-U11 RAS APP FATAL ciod: failed to read message prefix on control stream",
      "KERNSTOR 1118709403 2005.06.13 R10-M1-N5-C:J15-U11 2005-06-13-17.36.43.927885 R10-M1-N5-C:J15-U11 RAS KERNEL FATAL data storage interrupt",
    ];
    const filler = Array.from(
      { length: 80 },
      (_, i) =>
        `- 1117950000 2005.06.05 R24-M1-N8-C:J09-U11 2005-06-05-00.09.${String(i).padStart(2, "0")}.000000 R24-M1-N8-C:J09-U11 RAS KERNEL INFO generating core.${i}`
    );
    const text = lines(...tlb, ...filler, ...other);
    const out = pruneText(text, 6000, {
      query: "what broke FATAL error failure crash kernel app",
    });

    assert.match(out.prunedText, /data TLB error interrupt/);
    assert.match(out.prunedText, /x60 repeated/);
    assert.match(out.prunedText, /failed to read message prefix/);
    assert.match(out.prunedText, /data storage interrupt/);
    const tlbCopies = out.prunedText.split("\n").filter((row) =>
      row.includes("data TLB error interrupt")
    );
    assert.equal(tlbCopies.length, 1);
  });

  test("same crash on many hosts does not starve a different interrupt", () => {
    const loads = Array.from({ length: 15 }, (_, i) => {
      const host = `R${40 + i}-M0-N${i}-I:J18-U01`;
      const unix = 1123914312 + i;
      return `- ${unix} 2005.08.12 ${host} 2005-08-12-23.25.${String(i).padStart(2, "0")}.135766 ${host} RAS APP FATAL ciod: Error loading /bgl/apps/scaletest/performance/MINIBEN/mb_243_0810/allreduce.rts: invalid or missing program image, Exec format error`;
    });
    const storage =
      "KERNSTOR 1118709403 2005.06.13 R10-M1-N5-C:J15-U11 2005-06-13-17.36.43.927885 R10-M1-N5-C:J15-U11 RAS KERNEL FATAL data storage interrupt";
    const mmcs =
      "MMCS 1123051862 2005.08.03 NULL 2005-08-03-16.11.02.839771 NULL RAS MMCS ERROR idoproxydb hit ASSERT condition: ASSERT expression=0 Source file=idotransportmgr.cpp Source line=1229 Function=int IdoTransportMgr::SendPacket(IdoUdpMgr*, BglCtlPavTrace*)";
    const text = lines(...loads, storage, mmcs);
    const out = pruneText(text, 1200, { query: "what broke FATAL error failure crash kernel app" });
    assert.match(out.prunedText, /allreduce\.rts/);
    assert.match(out.prunedText, /data storage interrupt/);
    assert.match(out.prunedText, /idoproxydb hit ASSERT/);
    const loadCopies = out.prunedText.split("\n").filter((row) => row.includes("allreduce.rts"));
    assert.ok(loadCopies.length <= 3, `kept ${loadCopies.length} allreduce copies`);
  });

  test("diversityKey folds digits glued to letters so host variants match", () => {
    const a =
      "- 1123914312 2005.08.12 R44-M0-N8-I:J18-U01 2005-08-12-23.25.12.135766 R44-M0-N8-I:J18-U01 RAS APP FATAL ciod: Error loading /bgl/apps/scaletest/performance/MINIBEN/mb_243_0810/allreduce.rts: invalid or missing program image, Exec format error";
    const b =
      "- 1123914469 2005.08.12 R46-M0-N0-I:J18-U01 2005-08-12-23.27.49.807991 R46-M0-N0-I:J18-U01 RAS APP FATAL ciod: Error loading /bgl/apps/scaletest/performance/MINIBEN/mb_243_0810/allreduce.rts: invalid or missing program image, Exec format error";
    assert.equal(diversityKey(a), diversityKey(b));
    assert.notEqual(adjacentKey(a), adjacentKey(b));
  });

  test("interleaved copies of one crash still keep a different failure", () => {
    const rows = [];
    for (let i = 0; i < 40; i += 1) {
      rows.push(`FATAL disk full on /var/log/app ts=${1000 + i} node=${i}`);
      rows.push(`INFO heartbeat ${i}`);
    }
    rows.push("FATAL database connection refused");
    const diskLine = "FATAL disk full on /var/log/app ts=1000 node=0";
    const otherLine = "FATAL database connection refused";
    assert.equal(diversityKey(diskLine) === diversityKey(otherLine), false);

    const out = pruneText(lines(...rows), 800, { query: "what FATAL error" });
    assert.match(out.prunedText, /database connection refused/);
    const diskCopies = out.prunedText.split("\n").filter((row) => row.includes("disk full"));
    assert.ok(diskCopies.length >= 1);
    assert.ok(
      diskCopies.length < 40,
      `expected the disk-full storm not to fill the budget, kept ${diskCopies.length}`
    );
  });
});
