import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, test } from "node:test";

const packageDir = resolve(import.meta.dirname, "..");
const outDir = mkdtempSync(join(tmpdir(), "material-symbols-cli-"));

after(() => rmSync(outDir, { recursive: true, force: true }));

function run(args: string[], input = "") {
  return spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts", "subset", ...args], {
    cwd: packageDir,
    encoding: "utf-8",
    input,
  });
}

test("writes the fonts and a stylesheet", () => {
  const dir = join(outDir, "fonts");
  const result = run(["test/fixtures/v4/default.css", "--outDir", dir]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(dir).sort(), [
    "material-symbols-outlined.woff2",
    "material-symbols.css",
  ]);
});

test("fails if the input uses no symbols", () => {
  const dir = join(outDir, "no-symbols");
  const result = run(["--outDir", dir], `@import "tailwindcss";`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No Material Symbols found/);
  assert.ok(!existsSync(dir));
});

test("fails without a stack trace if an input file can't be read", () => {
  const result = run(["does-not-exist.css", "--outDir", join(outDir, "missing")]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Could not read input file/);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
});
