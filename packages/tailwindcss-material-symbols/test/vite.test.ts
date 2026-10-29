import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, before, describe, test } from "node:test";
import * as fontkit from "fontkit";
import { build, createLogger, createServer, type InlineConfig, type Rollup } from "vite";
import materialSymbols from "../src/vite";

// Builds a small app from the Tailwind v4 fixtures in `test/fixtures/v4/`:
// - `icons.css`: `home`, imported as a stylesheet
// - `inline.css`: `home` and `2d_2`, imported with `?inline`
// - `plain.css`: no icons

let root: string;

function fixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, "fixtures/v4", name), "utf-8");
}

before(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), "material-symbols-vite-")));
  writeFileSync(join(root, "icons.css"), fixture("default.css"));
  writeFileSync(join(root, "inline.css"), fixture("five-digit-codepoint.css"));
  writeFileSync(join(root, "plain.css"), ".plain { color: red; }\n");
  writeFileSync(
    join(root, "main.js"),
    `import "./icons.css";\nimport "./plain.css";\nimport inline from "./inline.css?inline";\nexport { inline };\n`,
  );
});

after(() => rmSync(root, { recursive: true, force: true }));

async function buildApp(config: InlineConfig = {}) {
  const output = (await build({
    root,
    configFile: false,
    logLevel: "silent",
    plugins: [materialSymbols()],
    ...config,
    build: {
      write: false,
      lib: false,
      rollupOptions: { input: join(root, "main.js"), preserveEntrySignatures: "exports-only" },
      ...config.build,
    },
  })) as Rollup.RollupOutput;
  const files = output.output;
  const text = (ext: string) =>
    files
      .filter((f) => f.fileName.endsWith(ext))
      .map((f) => (f.type == "chunk" ? f.code : String(f.source)))
      .join("\n");
  return { files, css: text(".css"), js: text(".js") };
}

function fontFaces(code: string): string[] {
  return Array.from(code.matchAll(/@font-face\s*\{[^}]*\}/g), (m) => m[0]);
}

/** Returns the codepoints of the inlined font in an `@font-face` rule. */
function inlinedCodepoints(fontFace: string): number[] {
  const base64 = /data:font\/woff2;base64,([\w+/=]+)/.exec(fontFace)![1]!;
  const font = fontkit.create(Buffer.from(base64, "base64")) as fontkit.Font;
  return font.characterSet.filter((c) => c != 0xffff).sort((a, b) => a - b);
}

describe("build", () => {
  test("adds subset fonts to each CSS module that uses icons", async () => {
    const { css, js } = await buildApp();

    // `icons.css`, with the font inlined below `assetsInlineLimit`.
    const [documentFace, ...rest] = fontFaces(css);
    assert.equal(rest.length, 0);
    assert.match(documentFace!, /Material Symbols Outlined/);
    assert.deepEqual(inlinedCodepoints(documentFace!), [0xe9b2]);
    assert.match(css, /\.plain\s*\{/);

    // `inline.css?inline`, in the JS string.
    const [inlineFace, ...inlineRest] = fontFaces(js);
    assert.equal(inlineRest.length, 0);
    assert.deepEqual(inlinedCodepoints(inlineFace!), [0xe9b2, 0xfff0e]);
  });

  test("emits fonts above assetsInlineLimit as assets", async () => {
    const { files, css } = await buildApp({ build: { assetsInlineLimit: 0 } });
    const fonts = files.filter((f) => f.fileName.endsWith(".woff2"));
    // One subset for each module: `home` and `home` + `2d_2`.
    assert.equal(fonts.length, 2);
    for (const font of fonts) {
      assert.match(font.fileName, /^assets\/material-symbols-outlined-[\w-]+\.woff2$/);
    }
    assert.match(css, /url\("?\/assets\/material-symbols-outlined-[\w-]+\.woff2"?\)/);
  });

  test("warns about the deprecated include option", async () => {
    const warnings: string[] = [];
    const logger = createLogger("silent");
    logger.warn = (msg) => void warnings.push(msg);
    await build({
      root,
      configFile: false,
      customLogger: logger,
      plugins: [materialSymbols({ include: ["./icons.css"] })],
      build: { write: false, rollupOptions: { input: join(root, "main.js") } },
    });
    assert.ok(warnings.some((w) => w.includes("`include` option is deprecated")));
  });
});

describe("dev server", () => {
  for (const base of ["/", "/sub/"]) {
    test(`adds the full fonts with base ${base}`, async () => {
      const server = await createServer({
        root,
        base,
        configFile: false,
        logLevel: "silent",
        plugins: [materialSymbols()],
        server: { middlewareMode: true, ws: false },
      });
      try {
        const icons = await server.transformRequest("/icons.css?inline");
        const [face, ...rest] = fontFaces(
          JSON.parse(icons!.code.match(/export default (".*")/)![1]!),
        );
        assert.equal(rest.length, 0);
        assert.match(
          face!,
          new RegExp(`url\\("${base}@fs/.*/material-symbols/material-symbols-outlined\\.woff2"\\)`),
        );

        const plain = await server.transformRequest("/plain.css?inline");
        assert.doesNotMatch(plain!.code, /@font-face/);
      } finally {
        await server.close();
      }
    });
  }
});
