import assert from "node:assert/strict";
import { test } from "node:test";
import { materialSymbolsDir, readCodepoints } from "../scripts/codepoints";

test("reads the codepoint map from the material-symbols fonts", () => {
  const codepoints = readCodepoints(materialSymbolsDir());
  assert.ok(codepoints.size > 4000);
  // The glyphs of `home` and `search` also have the older codepoints e88a and e8b6. Google's
  // `codepoints` files use the highest one.
  assert.equal(codepoints.get("home"), 0xe9b2);
  assert.equal(codepoints.get("search"), 0xef7a);
  assert.equal(codepoints.get("2d_2"), 0xfff0e);
  // An alias of `alarm` that `material-symbols/index.d.ts` doesn't list.
  assert.equal(codepoints.get("access_alarm"), 0xe855);
  for (const name of codepoints.keys()) assert.match(name, /^\w+$/);
});
