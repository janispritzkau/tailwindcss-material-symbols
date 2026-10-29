// Reads the name → codepoint map from the Material Symbols fonts: each ligature in the GSUB
// table spells a name and points to a glyph, and the cmap table gives the glyph's codepoints.
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import * as fontkit from "fontkit";

export const STYLES = ["outlined", "rounded", "sharp"] as const;

export type Codepoints = Map<string, number>;

const require = createRequire(import.meta.url);

/** Directory of the installed `material-symbols` package. */
export function materialSymbolsDir(): string {
  return dirname(require.resolve("material-symbols/package.json"));
}

/** Version of the `material-symbols` package in `dir`. */
export function materialSymbolsVersion(dir: string): string {
  return require(resolve(dir, "package.json")).version;
}

/**
 * Reads the codepoint map of all three styles from a `material-symbols` package directory and
 * checks that they agree. The map is sorted by name.
 */
export function readCodepoints(dir: string): Codepoints {
  let result: Codepoints | undefined;
  for (const style of STYLES) {
    const path = resolve(dir, `material-symbols-${style}.woff2`);
    const codepoints = readFontCodepoints(path);
    if (!result) {
      result = codepoints;
      continue;
    }
    const diff = diffCodepoints(result, codepoints);
    const changed = [...result].filter(
      ([name, cp]) => codepoints.has(name) && codepoints.get(name) !== cp,
    );
    if (diff.added.length || diff.removed.length || changed.length) {
      throw new Error(
        `${style} doesn't match ${STYLES[0]}: ` +
          `added ${JSON.stringify(diff.added)}, removed ${JSON.stringify(diff.removed)}, ` +
          `different codepoints ${JSON.stringify(changed.map(([name]) => name))}`,
      );
    }
  }
  return result!;
}

/** Reads the codepoint map of a single font file. */
export function readFontCodepoints(path: string): Codepoints {
  const font = fontkit.openSync(path) as fontkit.Font & { GSUB: any };

  // Codepoints of each glyph, from the cmap table.
  const glyphCodepoints = new Map<number, number[]>();
  for (const cp of font.characterSet) {
    const id = font.glyphForCodePoint(cp).id;
    glyphCodepoints.set(id, [...(glyphCodepoints.get(id) ?? []), cp]);
  }

  // Characters of the glyphs that ligature components refer to. Upper and lower case letters share
  // a glyph, so that ligatures are case-insensitive. The names are lower case.
  const chars = new Map<number, string>();
  for (const [id, cps] of glyphCodepoints) {
    const ascii = cps.filter((cp) => cp >= 0x20 && cp < 0x7f);
    if (ascii.length) chars.set(id, String.fromCodePoint(Math.max(...ascii)));
  }

  const codepoints: Codepoints = new Map();
  const errors: string[] = [];

  for (const lookup of toArray(font.GSUB.lookupList)) {
    for (let table of toArray(lookup.subTables)) {
      // The ligatures sit in an Extension lookup (type 7) that wraps the ligature lookup (type 4).
      const type = lookup.lookupType === 7 ? table.lookupType : lookup.lookupType;
      if (lookup.lookupType === 7) table = table.extension;
      if (type !== 4) continue;

      const firstGlyphs = coverageGlyphs(table.coverage);
      toArray(table.ligatureSets).forEach((set, index) => {
        for (const ligature of toArray(set)) {
          const glyphs: number[] = [firstGlyphs[index]!, ...toArray(ligature.components)];
          const name = glyphs.map((id) => chars.get(id) ?? "\0").join("");
          if (!/^\w+$/.test(name)) {
            errors.push(
              `ligature for glyph ${ligature.glyph} has an invalid name ${JSON.stringify(name)}`,
            );
            continue;
          }
          // A glyph can have several codepoints. Google's `codepoints` files use the highest one.
          const pua = (glyphCodepoints.get(ligature.glyph) ?? []).filter(isPrivateUse);
          if (pua.length === 0) {
            errors.push(
              `ligature "${name}" (glyph ${ligature.glyph}) has no codepoint in the cmap`,
            );
            continue;
          }
          const cp = Math.max(...pua);
          const existing = codepoints.get(name);
          if (existing !== undefined && existing !== cp) {
            errors.push(`ligature "${name}" maps to both ${hex(existing)} and ${hex(cp)}`);
          }
          codepoints.set(name, cp);
        }
      });
    }
  }

  if (errors.length) throw new Error(`${path}:\n  ${errors.join("\n  ")}`);
  if (codepoints.size === 0) throw new Error(`${path}: no ligatures found`);
  return new Map([...codepoints].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

export function diffCodepoints(
  base: Iterable<[string, number]> | Codepoints,
  head: Iterable<[string, number]> | Codepoints,
): { added: string[]; removed: string[] } {
  const baseNames = new Set([...base].map(([name]) => name));
  const headNames = new Set([...head].map(([name]) => name));
  return {
    added: [...headNames].filter((name) => !baseNames.has(name)),
    removed: [...baseNames].filter((name) => !headNames.has(name)),
  };
}

export function hex(cp: number): string {
  return cp.toString(16);
}

function isPrivateUse(cp: number): boolean {
  return (
    (cp >= 0xe000 && cp <= 0xf8ff) ||
    (cp >= 0xf0000 && cp <= 0xffffd) ||
    (cp >= 0x100000 && cp <= 0x10fffd)
  );
}

/** Glyph IDs of a coverage table, by coverage index. */
function coverageGlyphs(coverage: any): number[] {
  if (coverage.version === 1) return toArray(coverage.glyphs);
  const glyphs: number[] = [];
  for (const { start, end, startCoverageIndex } of toArray(coverage.rangeRecords)) {
    for (let id = start; id <= end; id++) glyphs[startCoverageIndex + id - start] = id;
  }
  return glyphs;
}

// fontkit returns lazy arrays for some tables and plain arrays for others.
function toArray<T = any>(value: any): T[] {
  return typeof value?.toArray === "function" ? value.toArray() : Array.from(value ?? []);
}
