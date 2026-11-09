/* Browser copy of roka-mcp/lib/prune.js — keep in sync. */
/**
 * Shared pruning engine used by the MCP tools (serve) and by watch mode.
 */

export const DEFAULT_BUDGET = 4000;
export const DEFAULT_RADIUS = 2;
export const CRASH_PATTERN = /\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic)\b/i;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "by",
  "did",
  "do",
  "does",
  "during",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "its",
  "last",
  "me",
  "not",
  "of",
  "on",
  "or",
  "please",
  "show",
  "that",
  "the",
  "these",
  "this",
  "those",
  "to",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
]);

function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function result({
  prunedText,
  originalLines,
  originalChars,
  mode,
  budget,
  budgetExceeded,
  budgetOverageChars,
  protectedOmittedLines,
  protectedOmittedChars,
  queryTerms,
  kept,
  warnings,
}) {
  const prunedLines = prunedText === "" ? 0 : prunedText.split("\n").length;
  return {
    prunedText,
    originalLines,
    prunedLines,
    originalChars,
    prunedChars: prunedText.length,
    mode,
    budget,
    budgetExceeded,
    budgetOverageChars,
    protectedOmittedLines,
    protectedOmittedChars,
    queryTerms,
    kept,
    warnings,
  };
}

function passthrough(text, budget, extra = {}) {
  const originalLines = text === "" ? 0 : text.split("\n").length;
  return result({
    prunedText: text,
    originalLines,
    originalChars: text.length,
    mode: "passthrough",
    budget,
    budgetExceeded: false,
    budgetOverageChars: 0,
    protectedOmittedLines: 0,
    protectedOmittedChars: 0,
    queryTerms: extra.queryTerms ?? [],
    kept: extra.kept ?? [],
    warnings: extra.warnings ?? ["passthrough: original returned unchanged"],
  });
}

export function tokenizeQuery(query) {
  if (typeof query !== "string" || query.trim() === "") return [];
  const seen = new Set();
  const terms = [];
  for (const raw of query.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw) || seen.has(raw)) continue;
    seen.add(raw);
    terms.push(raw);
  }
  terms.sort();
  return terms;
}

export function scoreLine(line, terms) {
  if (terms.length === 0) {
    return { score: 0, matchedTerms: [] };
  }
  const matchedTerms = [];
  for (const term of terms) {
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
    if (re.test(line)) matchedTerms.push(term);
  }
  return { score: matchedTerms.length, matchedTerms };
}

function wouldFit(currentLen, line, budget) {
  const next = currentLen === 0 ? line.length : currentLen + 1 + line.length;
  return next <= budget;
}

function nextLength(currentLen, line) {
  return currentLen === 0 ? line.length : currentLen + 1 + line.length;
}

/**
 * Collapse adjacent duplicate lines, keep crash/query evidence, pack to a
 * character budget. Never character-slices a selected line. If a single
 * protected line is longer than the budget it is kept whole and the overage
 * is reported. Unknown/binary/unusable input is returned unchanged.
 *
 * @param {string} text
 * @param {number} [budget]
 * @param {{ query?: string, radius?: number }} [options]
 */
export function pruneText(text, budget = DEFAULT_BUDGET, options = {}) {
  const query = typeof options.query === "string" ? options.query : "";
  const radius =
    Number.isInteger(options.radius) && options.radius >= 0
      ? options.radius
      : DEFAULT_RADIUS;
  const queryTerms = tokenizeQuery(query);
  const requestedBudget = budget;

  if (typeof text !== "string") {
    return passthrough("", requestedBudget, {
      queryTerms,
      warnings: ["passthrough: input is not a string"],
    });
  }

  if (!Number.isFinite(budget) || budget <= 0) {
    return passthrough(text, requestedBudget, {
      queryTerms,
      warnings: ["passthrough: budget is not a positive number"],
    });
  }

  if (text.includes("\0")) {
    return passthrough(text, requestedBudget, {
      queryTerms,
      warnings: ["passthrough: binary or NUL-containing input"],
    });
  }

  try {
    return pruneSafe(text, budget, queryTerms, radius);
  } catch (err) {
    return passthrough(text, requestedBudget, {
      queryTerms,
      warnings: [`passthrough: ${err.message}`],
    });
  }
}

function pruneSafe(text, budget, queryTerms, radius) {
  if (text === "") {
    return result({
      prunedText: "",
      originalLines: 0,
      originalChars: 0,
      mode: "pruned",
      budget,
      budgetExceeded: false,
      budgetOverageChars: 0,
      protectedOmittedLines: 0,
      protectedOmittedChars: 0,
      queryTerms,
      kept: [],
      warnings: [],
    });
  }

  const rawLines = text.split("\n");
  const collapsed = [];

  for (const line of rawLines) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.line === line) {
      prev.count += 1;
    } else {
      collapsed.push({ line, count: 1 });
    }
  }

  const rendered = collapsed.map(({ line, count }) =>
    count > 1 ? `${line}  (x${count} repeated)` : line
  );

  const scored = rendered.map((line, idx) => {
    const { score, matchedTerms } = scoreLine(line, queryTerms);
    const crash = CRASH_PATTERN.test(line);
    return { line, idx, score, matchedTerms, crash };
  });

  const crashIdx = new Set(scored.filter((row) => row.crash).map((row) => row.idx));
  const neighborIdx = new Set();
  for (const idx of crashIdx) {
    for (let n = idx - radius; n <= idx + radius; n += 1) {
      if (n >= 0 && n < scored.length && !crashIdx.has(n)) neighborIdx.add(n);
    }
  }

  const joined = rendered.join("\n");
  if (joined.length <= budget) {
    const kept = scored.map((row) => ({
      idx: row.idx,
      score: row.score,
      matchedTerms: row.matchedTerms,
      reasons: reasonsFor(row, crashIdx, neighborIdx, false),
    }));
    return result({
      prunedText: joined,
      originalLines: rawLines.length,
      originalChars: text.length,
      mode: "pruned",
      budget,
      budgetExceeded: false,
      budgetOverageChars: 0,
      protectedOmittedLines: 0,
      protectedOmittedChars: 0,
      queryTerms,
      kept,
      warnings: [],
    });
  }

  const candidates = scored.map((row) => {
    const queryHit = row.score > 0;
    const crash = crashIdx.has(row.idx);
    const neighbor = neighborIdx.has(row.idx);
    const recency = row.idx;
    let rank = recency;
    let bucket = "recency";
    if (neighbor) {
      rank = 1_000_000 - row.idx;
      bucket = "neighbor";
    }
    if (crash) {
      rank = 2_000_000 - row.idx;
      bucket = "crash";
    }
    if (queryHit) {
      rank = 3_000_000 + row.score * 10_000 - row.idx;
      bucket = "query";
    }
    return { ...row, queryHit, neighbor, bucket, rank };
  });

  candidates.sort((a, b) => b.rank - a.rank || a.idx - b.idx);

  const selected = [];
  const selectedIdx = new Set();
  let used = 0;
  let budgetExceeded = false;
  let budgetOverageChars = 0;
  let protectedOmittedLines = 0;
  let protectedOmittedChars = 0;
  const warnings = [];

  for (const row of candidates) {
    if (selectedIdx.has(row.idx)) continue;
    const protectedLine = row.crash || row.queryHit || row.neighbor;
    if (wouldFit(used, row.line, budget)) {
      used = nextLength(used, row.line);
      selected.push(row);
      selectedIdx.add(row.idx);
      continue;
    }

    const lineOverBudget = row.line.length > budget;
    if (protectedLine && lineOverBudget && selected.length === 0) {
      selected.push(row);
      selectedIdx.add(row.idx);
      used = row.line.length;
      budgetExceeded = true;
      budgetOverageChars = row.line.length - budget;
      warnings.push(
        `budget exceeded by ${budgetOverageChars} chars: kept one protected line longer than the budget rather than slicing it`
      );
      continue;
    }

    if (protectedLine) {
      protectedOmittedLines += 1;
      protectedOmittedChars += row.line.length;
    }
  }

  selected.sort((a, b) => a.idx - b.idx);

  const prunedText = selected.map((row) => row.line).join("\n");
  if (prunedText.length > budget && !budgetExceeded) {
    budgetExceeded = true;
    budgetOverageChars = prunedText.length - budget;
    warnings.push(`budget exceeded by ${budgetOverageChars} chars`);
  }

  const kept = selected.map((row) => ({
    idx: row.idx,
    score: row.score,
    matchedTerms: row.matchedTerms,
    reasons: reasonsFor(row, crashIdx, neighborIdx, row.queryHit),
  }));

  if (protectedOmittedLines > 0) {
    warnings.push(
      `omitted ${protectedOmittedLines} protected line(s) (${protectedOmittedChars} chars) that would not fit the budget as whole lines`
    );
  }

  return result({
    prunedText,
    originalLines: rawLines.length,
    originalChars: text.length,
    mode: "pruned",
    budget,
    budgetExceeded,
    budgetOverageChars,
    protectedOmittedLines,
    protectedOmittedChars,
    queryTerms,
    kept,
    warnings,
  });
}

function reasonsFor(row, crashIdx, neighborIdx, queryHit) {
  const reasons = [];
  if (queryHit || row.score > 0) reasons.push("query");
  if (crashIdx.has(row.idx) || row.crash) reasons.push("crash");
  if (neighborIdx.has(row.idx) || row.neighbor) reasons.push("neighbor");
  if (reasons.length === 0) reasons.push("recency");
  return reasons;
}
