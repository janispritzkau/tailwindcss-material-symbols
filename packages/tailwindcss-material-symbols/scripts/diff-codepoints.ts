// Prints the names added and removed between two `material-symbols` package directories as JSON:
// `{ "base": "<version>", "head": "<version>", "added": [...], "removed": [...] }`.
// Removed names are a breaking change for users of the `icon-symbol-*` utilities.
//
// Usage: tsx scripts/diff-codepoints.ts <base dir> [<head dir>]
// The head directory defaults to the installed `material-symbols` package.
import { resolve } from "node:path";
import {
  diffCodepoints,
  materialSymbolsDir,
  materialSymbolsVersion,
  readCodepoints,
} from "./codepoints";

const [baseArg, headArg] = process.argv.slice(2);
if (!baseArg) {
  console.error("Usage: tsx scripts/diff-codepoints.ts <base dir> [<head dir>]");
  process.exit(2);
}

const baseDir = resolve(baseArg);
const headDir = headArg ? resolve(headArg) : materialSymbolsDir();
const { added, removed } = diffCodepoints(readCodepoints(baseDir), readCodepoints(headDir));

const result = {
  base: materialSymbolsVersion(baseDir),
  head: materialSymbolsVersion(headDir),
  added,
  removed,
};
console.log(JSON.stringify(result, null, 2));
