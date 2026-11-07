import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURE_DIR = dirname(fileURLToPath(import.meta.url)) + "/fixtures";

function expand(block) {
  return Array.from({ length: block.count }, (_, i) => `${block.line} ${i}`);
}

export function buildLog(spec) {
  const gap = Number.isInteger(spec.gapCount) ? spec.gapCount : 6;
  const gapLines = Array.from({ length: gap }, (_, i) => `INFO unrelated ${i}`);
  return [...expand(spec.prefix), ...spec.middle, ...gapLines, ...expand(spec.suffix)].join("\n");
}

export async function loadFixtures() {
  const names = (await readdir(FIXTURE_DIR)).filter((name) => name.endsWith(".json")).sort();
  const fixtures = [];
  for (const name of names) {
    const spec = JSON.parse(await readFile(join(FIXTURE_DIR, name), "utf8"));
    fixtures.push({
      ...spec,
      file: name,
      text: buildLog(spec),
    });
  }
  return fixtures;
}
