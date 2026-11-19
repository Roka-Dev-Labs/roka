/**
 * Shared pruning engine used by the MCP tools (serve) and by watch mode.
 */

export const DEFAULT_BUDGET = 4000;
export const DEFAULT_RADIUS = 2;
/** First packing pass keeps this many lines per template so one storm cannot fill the budget. */
export const TEMPLATE_PACK_CAP = 1;

const CRASH_KEYWORD_RE = /\b(?:ERROR|FATAL|CRITICAL|Exception|Traceback|panic|ANR)\b/i;
const CRASH_JAVA_RE = /[A-Z][A-Za-z0-9]*(?:Exception|Error)\b/;
const CRASH_LIFECYCLE_RE = /\b(?:has died|Force finishing|crashed service|Fatal exception)\b/i;
const CRASH_LOGCAT_RE = /(?:^|\s)[EF]\s+[A-Za-z][\w./$]*:/;
const LOGCAT_LEVEL_RE = /(?:^|\s)([VDIWEFS])\s+[A-Za-z][\w./$]*:/;

export const CRASH_PATTERN = {
  source:
    String.raw`\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic|ANR)\b` +
    String.raw`|[A-Z][A-Za-z0-9]*(Exception|Error)\b` +
    String.raw`|\bhas died\b|\bForce finishing\b|\bcrashed service\b` +
    String.raw`|(?:^|\s)[EF]\s+[A-Za-z][\w./$]*:`,
  test(line) {
    return isCrashLine(line);
  },
};

export function isCrashLine(line) {
  const text = String(line);
  CRASH_KEYWORD_RE.lastIndex = 0;
  CRASH_JAVA_RE.lastIndex = 0;
  CRASH_LIFECYCLE_RE.lastIndex = 0;
  CRASH_LOGCAT_RE.lastIndex = 0;
  return (
    CRASH_KEYWORD_RE.test(text) ||
    CRASH_JAVA_RE.test(text) ||
    CRASH_LIFECYCLE_RE.test(text) ||
    CRASH_LOGCAT_RE.test(text)
  );
}

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
  "had",
  "has",
  "have",
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
  "went",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
]);

const SYNONYM_GROUPS = [
  ["error", "errors", "err"],
  ["exception", "exceptions"],
  ["crash", "crashes", "crashed", "crashing", "died"],
  ["fatal"],
  ["warn", "warning", "warnings"],
  ["fail", "fails", "failed", "failure", "failures"],
  ["broke", "broken", "break"],
  ["anr"],
  ["panic", "panicked"],
  ["issue", "issues"],
  ["bug", "bugs"],
  ["wrong"],
];

const FAILURE_INTENT = new Set(SYNONYM_GROUPS.flat());

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

function stemVariants(term) {
  const variants = new Set([term]);
  if (term.endsWith("ies") && term.length > 4) variants.add(`${term.slice(0, -3)}y`);
  if (term.endsWith("es") && term.length > 4) variants.add(term.slice(0, -2));
  if (term.endsWith("s") && !term.endsWith("ss") && term.length > 3) {
    variants.add(term.slice(0, -1));
  }
  if (term.endsWith("ed") && term.length > 4) variants.add(term.slice(0, -2));
  if (term.endsWith("ing") && term.length > 5) variants.add(term.slice(0, -3));
  return variants;
}

function synonymVariants(term) {
  const variants = stemVariants(term);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((item) => variants.has(item))) {
      for (const item of group) variants.add(item);
    }
  }
  return variants;
}

function logcatLevel(line) {
  LOGCAT_LEVEL_RE.lastIndex = 0;
  const match = LOGCAT_LEVEL_RE.exec(String(line));
  return match ? match[1] : null;
}

function logcatLevelsFor(variants) {
  const levels = new Set();
  for (const variant of variants) {
    if (
      variant === "error" ||
      variant === "errors" ||
      variant === "err" ||
      variant === "crash" ||
      variant === "crashes" ||
      variant === "crashed" ||
      variant === "fatal"
    ) {
      levels.add("E");
      levels.add("F");
    }
    if (variant === "warn" || variant === "warning" || variant === "warnings") {
      levels.add("W");
    }
  }
  return levels;
}

function termMatchesLine(term, line) {
  const variants = synonymVariants(term);
  const wordRe = new RegExp(`\\b(?:${[...variants].map(escapeRegex).join("|")})\\b`, "i");
  if (wordRe.test(line)) return true;
  if (variants.has("exception") || variants.has("exceptions")) {
    if (/Exception\b/i.test(line)) return true;
  }
  if (variants.has("error") || variants.has("errors")) {
    if (/[A-Z][A-Za-z0-9]*Error\b/.test(line)) return true;
  }
  const level = logcatLevel(line);
  if (level && logcatLevelsFor(variants).has(level)) return true;
  return false;
}

export function queryHasFailureIntent(terms) {
  return terms.some((term) => FAILURE_INTENT.has(term));
}

export function scoreLine(line, terms) {
  if (!terms || terms.length === 0) {
    return { score: 0, matchedTerms: [] };
  }
  const matchedTerms = [];
  for (const term of terms) {
    if (termMatchesLine(term, line)) matchedTerms.push(term);
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
 * Strip timestamps, IPs, hex ids, and unix epochs so two copies of the same
 * event still match when only the clock moved.
 */
export function adjacentKey(line) {
  return String(line)
    .replace(/\r/g, "")
    .replace(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/g, "#")
    .replace(/\b\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}(?:\.\d+)?\b/g, "#")
    .replace(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\b/g,
      "#"
    )
    .replace(/\b\d{4}\.\d{2}\.\d{2}\b/g, "#")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "#")
    .replace(/\b\d{2}:\d{2}:\d{2}(?:[.,]\d+)?\b/g, "#")
    .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, "#")
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g, "#")
    .replace(/\b0x[0-9a-fA-F]+\b/gi, "#")
    .replace(/\b\d{10,16}\b/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Stronger fingerprint used only while packing: remaining numbers (node ids,
 * pids) are folded so 30 hosts with the same interrupt share a template.
 */
export function diversityKey(line) {
  return adjacentKey(line)
    .replace(/\d+/g, "#")
    .replace(/(?:#\s*)+#/g, "#")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderCollapsedLine(line, count) {
  if (count <= 1) return line;
  return `${String(line).replace(/\r$/, "")}  (x${count} repeated)`;
}

export function collapseAdjacentLines(rawLines) {
  const collapsed = [];
  for (const line of rawLines) {
    const key = adjacentKey(line);
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.key === key) {
      prev.count += 1;
    } else {
      collapsed.push({ line, key, count: 1 });
    }
  }
  return collapsed;
}

/**
 * Collapse adjacent duplicate and near-duplicate lines, keep crash/query
 * evidence, pack to a character budget. One template cannot fill the budget
 * until every other template has had a representative. Never character-slices
 * a selected line. If a single protected line is longer than the budget it is
 * kept whole and the overage is reported. Unknown/binary/unusable input is
 * returned unchanged.
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
  const collapsed = collapseAdjacentLines(rawLines);
  const rendered = collapsed.map(({ line, count }) => renderCollapsedLine(line, count));

  const failureIntent = queryHasFailureIntent(queryTerms);
  const scored = rendered.map((line, idx) => {
    const { score, matchedTerms } = scoreLine(line, queryTerms);
    const crash = isCrashLine(line);
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
    const queryHit = row.score > 0 || (failureIntent && row.crash);
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
  const copies = new Map();
  let extrasHeldBack = 0;

  function trySelect(row, { countOmitted }) {
    if (selectedIdx.has(row.idx)) return false;
    const protectedLine = row.crash || row.queryHit || row.neighbor;
    if (wouldFit(used, row.line, budget)) {
      used = nextLength(used, row.line);
      selected.push(row);
      selectedIdx.add(row.idx);
      return true;
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
      return true;
    }

    if (countOmitted && protectedLine) {
      protectedOmittedLines += 1;
      protectedOmittedChars += row.line.length;
    }
    return false;
  }

  for (const row of candidates) {
    const protectedLine = row.crash || row.queryHit || row.neighbor;
    if (!protectedLine) continue;
    const key = diversityKey(row.line);
    const taken = copies.get(key) || 0;
    if (taken >= TEMPLATE_PACK_CAP) {
      extrasHeldBack += 1;
      continue;
    }
    if (trySelect(row, { countOmitted: false })) {
      copies.set(key, taken + 1);
    }
  }

  for (const row of candidates) {
    trySelect(row, { countOmitted: true });
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

  const keptTemplates = new Set(selected.map((row) => diversityKey(row.line)));
  const extrasStillOut = candidates.some((row) => !selectedIdx.has(row.idx));
  if (extrasHeldBack > 0 && extrasStillOut && keptTemplates.size > 1) {
    warnings.push(
      "skipped extra copies of repeated templates to keep other failures in budget"
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
