import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { loadFixtures } from "../eval/load-fixtures.js";
import { CRASH_PATTERN, pruneText } from "../lib/prune.js";

const fixtures = await loadFixtures();

describe("eval fixtures: query beats recency and tail", () => {
  test("loads planted incidents", () => {
    assert.ok(fixtures.length >= 4);
  });

  for (const fixture of fixtures) {
    test(`${fixture.id}: gold has no crash keyword; suffix ERROR is misleading`, () => {
      assert.equal(CRASH_PATTERN.test(fixture.gold), false);
      assert.equal(CRASH_PATTERN.test(fixture.suffix.line), true);
      assert.match(fixture.text, new RegExp(`${fixture.suffix.line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} 0`));
      assert.equal(fixture.text.includes(fixture.gold), true);
    });

    test(`${fixture.id}: query-aware prune keeps gold and beats recency and tail`, () => {
      const { text, budget, query, gold } = fixture;
      const withQuery = pruneText(text, budget, { query });
      const recency = pruneText(text, budget);
      const tail = text.slice(-budget);

      assert.equal(withQuery.prunedText.includes(gold), true, "query-aware missed gold");
      assert.equal(recency.prunedText.includes(gold), false, "recency unexpectedly kept gold — fixture too easy");
      assert.equal(tail.includes(gold), false, "tail unexpectedly kept gold — fixture too easy");

      const attributed = withQuery.kept.some(
        (row) => row.reasons.includes("query") && row.score > 0 && row.matchedTerms.length > 0
      );
      assert.equal(attributed, true, "kept gold was not attributed to query scoring");
      assert.ok(withQuery.queryTerms.length > 0);
    });
  }
});
