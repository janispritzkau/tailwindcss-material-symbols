import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { createRequire } from "node:module";
import * as fontkit from "fontkit";
import subsetFont from "subset-font";
import subsetMaterialSymbols from "../src/subset";

const require = createRequire(import.meta.url);

// From `src/generated/codepoints.css`.
const CODEPOINTS = { home: 0xe9b2, "2d_2": 0xfff0e, search: 0xef7a };

function codepoint(name: keyof typeof CODEPOINTS): number {
  return CODEPOINTS[name];
}

function readFixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, "fixtures", name), "utf-8");
}

function axesOf(source: Buffer): Record<string, { min: number; max: number }> {
  const font = fontkit.create(source) as fontkit.Font;
  return Object.fromEntries(
    Object.entries(font.variationAxes).map(([tag, axis]) => [
      tag,
      { min: axis!.min, max: axis!.max },
    ]),
  );
}

/** The SVG path of `home` in a font. */
function homePath(source: Buffer): string {
  const font = fontkit.create(source) as fontkit.Font;
  return font.glyphForCodePoint(codepoint("home")).path.toSVG();
}

/** The full Outlined font instanced at the default axis values and `fill`, with only `home`. */
async function homeInstance(fill: number): Promise<Buffer> {
  const full = readFileSync(require.resolve("material-symbols/material-symbols-outlined.woff2"));
  return subsetFont(full, String.fromCodePoint(codepoint("home")), {
    targetFormat: "woff2",
    variationAxes: { wght: 400, opsz: 24, GRAD: 0, FILL: fill },
  });
}

test("subsets the fonts to the detected symbols and axis ranges", async () => {
  // `--default-icon-font: var(--icon-font-rounded)`: Outlined isn't used, so it isn't built.
  const output = await subsetMaterialSymbols(readFixture("v4/custom-theme.min.css"));
  assert.deepEqual(
    output.map(({ fontFamily, fileName }) => ({ fontFamily, fileName })),
    [{ fontFamily: "Material Symbols Rounded", fileName: "material-symbols-rounded.woff2" }],
  );

  const font = fontkit.create(output[0]!.source) as fontkit.Font;
  assert.ok(font.characterSet.includes(codepoint("home")));
  assert.ok(font.characterSet.includes(codepoint("2d_2")));
  assert.ok(!font.characterSet.includes(codepoint("search")));

  // FILL and GRAD are pinned to their defaults, so the axes are removed.
  assert.deepEqual(axesOf(output[0]!.source), {
    wght: { min: 400, max: 650 },
    opsz: { min: 24, max: 48 },
  });
});

for (const version of ["v3", "v4"]) {
  test(`pins FILL to 1 if every icon is filled (${version})`, async () => {
    const output = await subsetMaterialSymbols(readFixture(`${version}/fill-default.min.css`));
    assert.equal(output.length, 1);
    assert.deepEqual(axesOf(output[0]!.source), {});

    const path = homePath(output[0]!.source);
    assert.equal(path, homePath(await homeInstance(1)));
    assert.notEqual(path, homePath(await homeInstance(0)));
  });

  test(`keeps the FILL axis for hover:icon-fill (${version})`, async () => {
    const output = await subsetMaterialSymbols(readFixture(`${version}/hover-fill.min.css`));
    assert.equal(output.length, 1);
    assert.deepEqual(axesOf(output[0]!.source), { FILL: { min: 0, max: 1 } });
  });
}

test("pins an axis to its configured default, not to 0", async () => {
  const css = `:root { --icon-symbol-home: "\\e9b2"; }`;
  const [unfilled] = await subsetMaterialSymbols(css);
  const [filled] = await subsetMaterialSymbols(css, { defaults: { fill: 1 } });
  assert.deepEqual((fontkit.create(filled!.source) as fontkit.Font).variationAxes, {});
  assert.ok(!unfilled!.source.equals(filled!.source));

  const [graded] = await subsetMaterialSymbols(css, { defaults: { grad: 200 } });
  assert.deepEqual((fontkit.create(graded!.source) as fontkit.Font).variationAxes, {});
  assert.ok(!unfilled!.source.equals(graded!.source));
  assert.ok(!filled!.source.equals(graded!.source));
});

test("detects the symbols in unminified Tailwind v4 output", async () => {
  // The v3 rules must not match `--icon-symbol: var(--icon-symbol-home)` after the space.
  const css = readFileSync(resolve(import.meta.dirname, "fixtures/v4/default.css"), "utf-8");
  const [output] = await subsetMaterialSymbols(css);
  const font = fontkit.create(output!.source) as fontkit.Font;
  assert.ok(font.characterSet.includes(codepoint("home")));
});
