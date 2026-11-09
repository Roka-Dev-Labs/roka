/**
 * Fire-and-forget telemetry for the signed-in dashboard.
 *
 * Only compact process metadata is sent — never pruned log text, never a
 * full filesystem path. Missing keys and network errors are ignored so
 * local prune still works offline.
 */

import { basename } from "node:path";

const API_BASE = (process.env.ROKA_API_URL_BASE || "https://api.roka-prune.com").replace(/\/+$/, "");

function apiKey() {
  return (process.env.ROKA_API_KEY || "").trim();
}

function countReasons(kept) {
  const counts = { query: 0, crash: 0, neighbor: 0, recency: 0 };
  if (!Array.isArray(kept)) return counts;
  for (const row of kept) {
    const reasons = Array.isArray(row?.reasons) ? row.reasons : [];
    for (const reason of reasons) {
      if (reason in counts) counts[reason] += 1;
    }
  }
  return counts;
}

export function eventFromPrune(tool, result = {}, extra = {}) {
  return {
    tool,
    query: String(extra.query || "").slice(0, 160),
    queryTerms: Array.isArray(result.queryTerms)
      ? result.queryTerms.map((term) => String(term).slice(0, 40)).slice(0, 24)
      : [],
    file: extra.file ? basename(String(extra.file)) : "",
    originalLines: Number(result.originalLines) || 0,
    prunedLines: Number(result.prunedLines) || 0,
    originalChars: Number(result.originalChars) || 0,
    prunedChars: Number(result.prunedChars) || 0,
    budget: Number(result.budget) || 0,
    mode: String(result.mode || "pruned").slice(0, 24),
    budgetExceeded: Boolean(result.budgetExceeded),
    reasons: countReasons(result.kept),
    warnings: Array.isArray(result.warnings)
      ? result.warnings.map((item) => String(item).slice(0, 180)).slice(0, 4)
      : [],
  };
}

async function postJson(path, body) {
  const key = apiKey();
  if (!key) return;
  try {
    await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // dashboard telemetry must never block or fail a local prune
  }
}

export function reportHeartbeat(agent = "") {
  return postJson("/api/mcp/heartbeat", { agent: String(agent || "").slice(0, 40) });
}

export function reportPrune(tool, result, extra = {}) {
  return postJson("/api/mcp/events", eventFromPrune(tool, result, extra));
}
