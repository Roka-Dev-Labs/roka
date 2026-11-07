#!/usr/bin/env node
/**
 * Compare Roka (query-aware) against recency-only prune and naive tail
 * on planted incidents. Does not call a model.
 *
 * Exit 1 if query-aware Roka misses gold or fails to beat tail/recency
 * on any fixture.
 */

import { pruneText } from "../lib/prune.js";
import { loadFixtures } from "./load-fixtures.js";

function contains(haystack, needle) {
  return haystack.includes(needle);
}

function arm(name, text, gold) {
  const hit = contains(text, gold);
  return { name, hit, chars: text.length };
}

const fixtures = await loadFixtures();
const rows = [];
let failures = 0;

for (const fixture of fixtures) {
  const { text, budget, query, gold, id } = fixture;
  const queryOut = pruneText(text, budget, { query });
  const recencyOut = pruneText(text, budget);
  const tailOut = text.slice(-budget);

  const queryArm = arm("query", queryOut.prunedText, gold);
  const recencyArm = arm("recency", recencyOut.prunedText, gold);
  const tailArm = arm("tail", tailOut, gold);
  const rawArm = arm("raw", text, gold);

  const goldKept = queryOut.kept.filter((row) => row.reasons.includes("query") && row.score > 0);
  const inspectable = goldKept.some((row) => row.matchedTerms.length > 0);

  const beatRecency = queryArm.hit && !recencyArm.hit;
  const beatTail = queryArm.hit && !tailArm.hit;
  const ok = queryArm.hit && beatRecency && beatTail && inspectable && rawArm.hit;

  if (!ok) failures += 1;

  rows.push({
    id,
    ok,
    queryHit: queryArm.hit,
    recencyHit: recencyArm.hit,
    tailHit: tailArm.hit,
    beatRecency,
    beatTail,
    inspectable,
    queryTerms: queryOut.queryTerms.join(","),
    omitted: queryOut.protectedOmittedLines,
    exceeded: queryOut.budgetExceeded,
    miss: ok
      ? ""
      : [
          queryArm.hit ? null : "query missed gold",
          beatRecency ? null : "did not beat recency",
          beatTail ? null : "did not beat tail",
          inspectable ? null : "gold not attributed to query scoring",
        ]
          .filter(Boolean)
          .join("; "),
  });
}

console.log("Roka eval: query-aware prune vs recency vs tail (no model)\n");
console.log(
  "id".padEnd(16),
  "query",
  "recency",
  "tail",
  "beats recency",
  "beats tail",
  "result"
);
for (const row of rows) {
  console.log(
    row.id.padEnd(16),
    row.queryHit ? "hit " : "MISS",
    row.recencyHit ? "hit    " : "miss   ",
    row.tailHit ? "hit " : "miss",
    row.beatRecency ? "yes" : "NO ",
    "          ",
    row.beatTail ? "yes" : "NO ",
    "       ",
    row.ok ? "ok" : `FAIL ${row.miss}`
  );
}

console.log(`\n${rows.length - failures}/${rows.length} fixtures: query kept gold and beat recency and tail.`);
if (failures > 0) {
  process.exit(1);
}
