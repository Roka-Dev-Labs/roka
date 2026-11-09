import { CRASH_PATTERN, pruneText, tokenizeQuery } from "./prune.js";

const SAMPLE_QUERY = "why did sshd fail to bind port";
const SAMPLE_BUDGET = 160;
const GOLD = "sshd: Bind to port 22: Address already in use";

function sampleLog() {
  return [
    ...Array.from({ length: 25 }, () => "INFO heartbeat ok"),
    GOLD,
    "sshd: exiting",
    ...Array.from({ length: 6 }, (_, i) => `INFO unrelated ${i}`),
    ...Array.from({ length: 40 }, () => "ERROR retry connection refused"),
  ].join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function collapseRows(text) {
  const rawLines = text === "" ? [] : text.split("\n");
  const collapsed = [];
  for (const line of rawLines) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.raw === line) prev.count += 1;
    else collapsed.push({ raw: line, count: 1 });
  }
  return {
    original: rawLines.length,
    rows: collapsed.map((row, idx) => {
      const line = row.count > 1 ? `${row.raw}  (x${row.count} repeated)` : row.raw;
      return { idx, line, crash: CRASH_PATTERN.test(line) };
    }),
  };
}

function renderChips(reasons) {
  return reasons
    .map((reason) => `<span class="hood-chip ${escapeHtml(reason)}">${escapeHtml(reason)}</span>`)
    .join("");
}

function renderLines(rows, keptOnly) {
  const visible = keptOnly ? rows.filter((row) => row.kept) : rows;
  if (visible.length === 0) {
    return `<div class="hood-line"><span class="n"></span><span class="t">// nothing yet</span><span></span></div>`;
  }
  return visible
    .map((row) => {
      const cls = row.kept ? "hood-line is-kept" : "hood-line";
      const chips = row.kept ? `<span class="hood-chips">${renderChips(row.reasons)}</span>` : "<span></span>";
      return `<div class="${cls}"><span class="n">${String(row.idx + 1).padStart(2, "0")}</span><span class="t">${escapeHtml(row.line)}</span>${chips}</div>`;
    })
    .join("");
}

export function mountHood(root) {
  if (!root) return () => {};

  root.innerHTML = `
    <header class="dash-hero reveal">
      <span class="eyebrow">MCP · same engine as prune_logs</span>
      <h1>What stayed, and why.</h1>
      <p>Collapse repeats. Keep crash lines whole. Score the question. Pack to a character budget. The agent sees this slice — not the dump.</p>
    </header>

    <div class="hood-mcp reveal">
      <article class="surface hood-tool">
        <div class="name">prune_logs</div>
        <p>Raw text already in the conversation. Optional query.</p>
      </article>
      <article class="surface hood-tool">
        <div class="name">prune_file</div>
        <p>Read a path on the machine. Log text does not upload.</p>
      </article>
      <article class="surface hood-tool">
        <div class="name">prune_tail</div>
        <p>Last N lines of a live file, then the same pack.</p>
      </article>
    </div>

    <div class="hood-stages reveal" id="hoodStages">
      <div class="surface hood-stage" data-stage="collapse"><div class="k">Collapse</div><div class="v" id="stCollapse">—</div><div class="s">adjacent repeats</div></div>
      <div class="surface hood-stage" data-stage="crash"><div class="k">Crash keep</div><div class="v" id="stCrash">—</div><div class="s">ERROR / FATAL / panic</div></div>
      <div class="surface hood-stage" data-stage="query"><div class="k">Query score</div><div class="v" id="stQuery">—</div><div class="s">whole-word terms</div></div>
      <div class="surface hood-stage" data-stage="pack"><div class="k">Pack</div><div class="v" id="stPack">—</div><div class="s">budget, never sliced</div></div>
    </div>

    <div class="hood-grid reveal">
      <section class="surface hood-panel">
        <h2>Input</h2>
        <div class="hood-field">
          <label for="hoodQuery">Query</label>
          <input class="lab-input" id="hoodQuery" type="text" value="${escapeHtml(SAMPLE_QUERY)}" autocomplete="off">
        </div>
        <div class="hood-field">
          <div class="hood-budget">
            <label for="hoodBudget">Character budget</label>
            <span id="hoodBudgetLabel">${SAMPLE_BUDGET}</span>
          </div>
          <input id="hoodBudget" type="range" min="120" max="4000" step="20" value="${SAMPLE_BUDGET}">
        </div>
        <div class="hood-field">
          <label for="hoodText">Log dump</label>
          <textarea class="lab-input" id="hoodText" spellcheck="false"></textarea>
        </div>
        <div class="hood-actions">
          <button type="button" class="btn-secondary" id="hoodSample">Load sample</button>
          <button type="button" class="btn-primary" id="hoodRun">Prune</button>
        </div>
      </section>
      <section class="surface hood-panel">
        <h2>Kept slice</h2>
        <div class="hood-lines" id="hoodKept"></div>
        <div class="hood-stats">
          <div class="hood-stat"><div class="k">In</div><div class="v" id="statIn">—</div></div>
          <div class="hood-stat"><div class="k">Out</div><div class="v" id="statOut">—</div></div>
          <div class="hood-stat"><div class="k">Dropped</div><div class="v" id="statDrop">—</div></div>
          <div class="hood-stat"><div class="k">Terms</div><div class="v" id="statTerms">—</div></div>
        </div>
        <p class="hood-note" id="hoodNote"></p>
      </section>
    </div>

    <section class="surface hood-panel reveal" style="margin-top:0.85rem">
      <h2>Collapsed dump</h2>
      <div class="hood-lines" id="hoodAll"></div>
    </section>

    <section class="surface hood-proto reveal">
      <span class="eyebrow">stdio</span>
      <pre id="hoodProto">// run prune to see the tool call</pre>
    </section>
  `;

  const els = {
    query: root.querySelector("#hoodQuery"),
    budget: root.querySelector("#hoodBudget"),
    budgetLabel: root.querySelector("#hoodBudgetLabel"),
    text: root.querySelector("#hoodText"),
    sample: root.querySelector("#hoodSample"),
    run: root.querySelector("#hoodRun"),
    kept: root.querySelector("#hoodKept"),
    all: root.querySelector("#hoodAll"),
    note: root.querySelector("#hoodNote"),
    proto: root.querySelector("#hoodProto"),
    stCollapse: root.querySelector("#stCollapse"),
    stCrash: root.querySelector("#stCrash"),
    stQuery: root.querySelector("#stQuery"),
    stPack: root.querySelector("#stPack"),
    stages: [...root.querySelectorAll(".hood-stage")],
    statIn: root.querySelector("#statIn"),
    statOut: root.querySelector("#statOut"),
    statDrop: root.querySelector("#statDrop"),
    statTerms: root.querySelector("#statTerms"),
  };

  function setLabFocus(el) {
    el.addEventListener("focus", () => el.classList.add("is-on"));
    el.addEventListener("blur", () => el.classList.remove("is-on"));
  }
  setLabFocus(els.query);
  setLabFocus(els.text);

  function loadSample() {
    els.text.value = sampleLog();
    els.query.value = SAMPLE_QUERY;
    els.budget.value = String(SAMPLE_BUDGET);
    els.budgetLabel.textContent = String(SAMPLE_BUDGET);
  }

  function run() {
    const text = els.text.value;
    const query = els.query.value.trim();
    const budget = Number(els.budget.value) || 4000;
    const collapsed = collapseRows(text);
    const result = pruneText(text, budget, query ? { query } : {});
    const keptMap = new Map(result.kept.map((row) => [row.idx, row]));
    const rows = collapsed.rows.map((row) => {
      const meta = keptMap.get(row.idx);
      return {
        ...row,
        kept: Boolean(meta),
        reasons: meta?.reasons ?? [],
        score: meta?.score ?? 0,
      };
    });

    const crashCount = collapsed.rows.filter((row) => row.crash).length;
    const queryKept = rows.filter((row) => row.kept && row.reasons.includes("query")).length;
    const dropped = Math.max(0, collapsed.rows.length - result.kept.length);
    const terms = result.queryTerms.length ? result.queryTerms.join(" · ") : "—";
    const tail = text.slice(-budget);
    const queryHits = rows.filter((row) => row.kept && row.reasons.includes("query"));
    const tailMiss = queryHits.some((row) => !tail.includes(row.line.replace(/ {2}\(x\d+ repeated\)$/, "")));

    els.stCollapse.textContent = `${collapsed.original} → ${collapsed.rows.length}`;
    els.stCrash.textContent = String(crashCount);
    els.stQuery.textContent = query ? String(queryKept) : "off";
    els.stPack.textContent = `${result.prunedChars} / ${budget}`;

    els.stages.forEach((stage) => {
      const key = stage.dataset.stage;
      const hot =
        (key === "collapse" && collapsed.rows.length < collapsed.original) ||
        (key === "crash" && crashCount > 0) ||
        (key === "query" && queryKept > 0) ||
        (key === "pack" && result.prunedChars <= budget);
      stage.classList.toggle("is-hot", hot);
    });

    els.kept.innerHTML = renderLines(rows, true);
    els.all.innerHTML = renderLines(rows, false);
    els.statIn.textContent = `${result.originalChars.toLocaleString()} ch`;
    els.statOut.textContent = `${result.prunedChars.toLocaleString()} ch`;
    els.statDrop.textContent = String(dropped);
    els.statTerms.textContent = terms;

    if (result.mode === "passthrough") {
      els.note.innerHTML = `<strong>Passthrough.</strong> ${escapeHtml(result.warnings[0] || "input returned unchanged.")}`;
    } else if (tailMiss) {
      els.note.innerHTML = `<strong>Naive tail of the same budget misses the cause line.</strong> Query ranking kept it; recency would not.`;
    } else if (result.warnings.length) {
      els.note.textContent = result.warnings.join(" ");
    } else {
      els.note.textContent = "Each kept line reports query, crash, neighbor, or recency. Lines are never character-sliced to fake a fit.";
    }

    const payload = {
      tool: "prune_logs",
      arguments: { budget, query: query || undefined, text: `${text.split("\n").length} lines` },
      result: {
        mode: result.mode,
        prunedChars: result.prunedChars,
        kept: result.kept.length,
        queryTerms: result.queryTerms,
      },
    };
    els.proto.innerHTML = `<span class="ok">→ initialize</span>           roka-mcp
<span class="ok">←</span>                      tools: prune_logs, prune_file, prune_tail
<span class="ok">→ tools/call prune_logs</span>
${escapeHtml(JSON.stringify(payload, null, 2))}`;
  }

  els.budget.addEventListener("input", () => {
    els.budgetLabel.textContent = Number(els.budget.value).toLocaleString();
  });
  els.sample.addEventListener("click", () => {
    loadSample();
    run();
  });
  els.run.addEventListener("click", run);

  loadSample();
  run();

  return () => {
    root.innerHTML = "";
  };
}
