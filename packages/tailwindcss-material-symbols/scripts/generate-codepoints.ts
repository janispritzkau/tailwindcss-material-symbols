// Generates the codepoint maps from the fonts in the installed `material-symbols` package:
// `src/generated/codepoints.css` (Tailwind v4 theme) and `src/v3/generated/codepoints.ts`
// (deprecated Tailwind v3 plugin). Both are gitignored and regenerated on every build.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  type Codepoints,
  diffCodepoints,
  hex,
  materialSymbolsDir,
  materialSymbolsVersion,
  readCodepoints,
} from "./codepoints";

const CSS_PATH = resolve(import.meta.dirname, "../src/generated/codepoints.css");
// Only imported by the deprecated Tailwind v3 plugin (`src/v3/`).
const TS_PATH = resolve(import.meta.dirname, "../src/v3/generated/codepoints.ts");

const dir = materialSymbolsDir();
const version = materialSymbolsVersion(dir);
const codepoints = readCodepoints(dir);
const header = `/* Generated from material-symbols@${version} by scripts/generate-codepoints.ts. Do not edit. */\n\n`;

const previous = readPrevious();
writeFile(CSS_PATH, header + css(codepoints));
writeFile(TS_PATH, header + ts(codepoints));

let summary = `material-symbols@${version}: ${codepoints.size} names`;
if (previous) {
  const { added, removed } = diffCodepoints(previous.codepoints, codepoints);
  summary += `, +${added.length} -${removed.length} vs the previous output (material-symbols@${previous.version})`;
  if (added.length) summary += `\n  added: ${added.join(", ")}`;
  if (removed.length) summary += `\n  removed: ${removed.join(", ")}`;
}
console.log(summary);

function css(codepoints: Codepoints): string {
  let code = "@theme {\n";
  for (const [name, cp] of codepoints) code += `  --icon-symbol-${name}: "\\${hex(cp)}";\n`;
  return code + "}\n";
}

function ts(codepoints: Codepoints): string {
  let code = "// prettier-ignore\nconst codepoints = {\n";
  for (const [name, cp] of codepoints) {
    code += `  "${name}": "${cp > 0xffff ? `\\u{${hex(cp)}}` : `\\u${hex(cp)}`}",\n`;
  }
  return code + "} as const;\n\nexport default codepoints;\n";
}

/** The names in the existing `codepoints.css`, if any, to print what changed. */
function readPrevious(): { version: string; codepoints: Codepoints } | undefined {
  if (!existsSync(CSS_PATH)) return;
  const code = readFileSync(CSS_PATH, "utf-8");
  const version = /material-symbols@(\S+)/.exec(code)?.[1] ?? "unknown";
  const entries = [...code.matchAll(/--icon-symbol-(\w+): "\\([0-9a-f]+)"/g)];
  return {
    version,
    codepoints: new Map(entries.map(([, name, cp]) => [name!, parseInt(cp!, 16)])),
  };
}

function writeFile(path: string, code: string) {
  mkdirSync(dirname(path), { recursive: true });
  // Leave the file untouched if nothing changed, so watchers don't rebuild.
  if (existsSync(path) && readFileSync(path, "utf-8") === code) return;
  writeFileSync(path, code);
}
