import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import * as fontkit from "fontkit";
import subsetMaterialSymbols from "../src/subset";

// From `src/generated/codepoints.css`.
const CODEPOINTS = { home: 0xe9b2, "2d_2": 0xfff0e, search: 0xef7a };

function codepoint(name: keyof typeof CODEPOINTS): number {
  return CODEPOINTS[name];
}

test("subsets the fonts to the detected symbols and axis ranges", async () => {
  const css = readFileSync(
    resolve(import.meta.dirname, "fixtures/v4/custom-theme.min.css"),
    "utf-8",
  );
  const output = await subsetMaterialSymbols(css);
  assert.deepEqual(Object.keys(output).sort(), ["outlined", "rounded"]);

  for (const data of Object.values(output)) {
    const font = fontkit.create(data!) as fontkit.Font;
    assert.ok(font.characterSet.includes(codepoint("home")));
    assert.ok(font.characterSet.includes(codepoint("2d_2")));
    assert.ok(!font.characterSet.includes(codepoint("search")));

    // FILL and GRAD are pinned to their defaults, so the axes are removed.
    const axes = Object.fromEntries(
      Object.entries(font.variationAxes).map(([tag, axis]) => [
        tag,
        { min: axis!.min, max: axis!.max },
      ]),
    );
    assert.deepEqual(axes, {
      wght: { min: 400, max: 650 },
      opsz: { min: 24, max: 48 },
    });
  }
});

test("detects the symbols in unminified Tailwind v4 output", async () => {
  // The v3 rules must not match `--icon-symbol: var(--icon-symbol-home)` after the space.
  const css = readFileSync(resolve(import.meta.dirname, "fixtures/v4/default.css"), "utf-8");
  const output = await subsetMaterialSymbols(css);
  const font = fontkit.create(output.outlined!) as fontkit.Font;
  assert.ok(font.characterSet.includes(codepoint("home")));
});
