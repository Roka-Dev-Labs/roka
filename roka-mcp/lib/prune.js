/**
 * Shared pruning engine used by the MCP tools (serve) and by watch mode.
 */

export const DEFAULT_BUDGET = 4000;
export const CRASH_PATTERN = /\b(ERROR|FATAL|CRITICAL|Exception|Traceback|panic)\b/i;

/**
 * Сжимает текст лога: схлопывает подряд идущие дубликаты строк и,
 * если текст всё ещё длиннее budget, обрезает его, отдавая приоритет
 * строкам с признаками ошибок и самым свежим (последним) строкам.
 */
export function pruneText(text, budget = DEFAULT_BUDGET) {
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

  const joined = rendered.join("\n");
  if (joined.length <= budget) {
    return {
      prunedText: joined,
      originalLines: rawLines.length,
      prunedLines: rendered.length,
      originalChars: text.length,
      prunedChars: joined.length,
    };
  }

  const important = [];
  const rest = [];
  rendered.forEach((line, idx) => {
    (CRASH_PATTERN.test(line) ? important : rest).push({ line, idx });
  });

  const kept = [...important];
  let usedChars = kept.reduce((sum, l) => sum + l.line.length + 1, 0);

  for (let i = rest.length - 1; i >= 0 && usedChars < budget; i -= 1) {
    const candidate = rest[i];
    usedChars += candidate.line.length + 1;
    kept.push(candidate);
  }

  kept.sort((a, b) => a.idx - b.idx);

  let prunedText = kept.map((l) => l.line).join("\n");
  if (prunedText.length > budget) {
    prunedText = prunedText.slice(prunedText.length - budget);
  }

  return {
    prunedText,
    originalLines: rawLines.length,
    prunedLines: kept.length,
    originalChars: text.length,
    prunedChars: prunedText.length,
  };
}
