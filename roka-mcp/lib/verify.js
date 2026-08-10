/**
 * Server-side Pro verification for roka-mcp.
 *
 * MCP is a Pro feature. Without this check, `connect`/`serve` only ever
 * checked that *some* string was passed as an API key — never that it was
 * real or still on a paying tier. This calls the hosted /api/status
 * endpoint (same one the dashboard uses) so an invalid, expired, or
 * free-tier key is actually rejected instead of silently working.
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

  if (!data.mcp_allowed) {
    return {
      ok: false,
      reason: "not_pro",
      tier: data.tier,
      message: `this key is on the "${data.tier || "free"}" tier — MCP requires Pro`,
    };
  }

  return { ok: true, tier: data.tier, tokensRemaining: data.tokens_remaining };
}

export function printVerificationError(context, result) {
  console.error(`[roka-mcp] ${context}: ${result.message}.`);
  if (result.reason === "network") {
    console.error(`  If this is a transient issue, try again — MCP fails closed on purpose.`);
  } else {
    console.error(`  MCP is a Pro feature. Get/upgrade an API key at ${API_KEY_DASHBOARD_URL}`);
  }
}
