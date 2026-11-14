/**
 * Optional API key check for roka-mcp (dashboard telemetry / hosted quota).
 *
 * When ROKA_API_KEY is set, this calls the hosted /api/status endpoint so
 * invalid or expired keys fail fast instead of failing mid-prune.
 */

const API_BASE = (process.env.ROKA_API_URL_BASE || "https://api.roka-prune.com").replace(/\/+$/, "");
const API_KEY_DASHBOARD_URL = "https://roka-prune.com/dashboard/api-keys.html";

/**
 * @param {string | null | undefined} apiKey
 * @returns {Promise<{ ok: true, tier: string, tokensRemaining: number } | { ok: false, reason: "missing" | "invalid" | "not_pro" | "network" | "error", tier?: string, message: string }>}
 */
export async function verifyProAccess(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return { ok: false, reason: "missing", message: "no API key was provided" };
  }

  let res;
  try {
    res = await fetch(`${API_BASE}/api/status`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    return {
      ok: false,
      reason: "network",
      message: `couldn't reach ${API_BASE} to verify the key (${err.message})`,
    };
  }

  if (res.status === 401) {
    return { ok: false, reason: "invalid", message: "the API key is invalid or expired" };
  }
  if (!res.ok) {
    return { ok: false, reason: "error", message: `verification request failed (HTTP ${res.status})` };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: "error", message: "verification response was not valid JSON" };
  }

  return { ok: true, tier: data.tier, tokensRemaining: data.tokens_remaining };
}

export function printVerificationError(context, result) {
  console.error(`[roka-mcp] ${context}: ${result.message}.`);
  if (result.reason === "network") {
    console.error(`  If this is a transient issue, try again — MCP fails closed on purpose.`);
  } else {
    console.error(`  Create or rotate a key at ${API_KEY_DASHBOARD_URL}`);
  }
}
