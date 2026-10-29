// Regenerates the CSS fixtures in `test/fixtures/` with real Tailwind v3 and v4 output.
// Run with `pnpm --filter ./packages/tailwindcss-material-symbols generate:fixtures`.

import { mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { compile, optimize } from "@tailwindcss/node";
import { transform } from "lightningcss";
import postcss from "postcss";
import tailwindcssV3 from "tailwindcss";
import type { Config } from "tailwindcss";
import materialSymbols from "../src/v3/index";

interface Fixture {
  name: string;
  classes: string[];
  /** v3: `theme` of the Tailwind config. */
  theme?: Config["theme"];
  /** v3 and v4: extra CSS after the Tailwind directives or imports. */
  css?: string;
}

// Not detected as an icon style: the class only starts with `icon`.
const ICONIC = `.iconic { font-family: "Material Symbols Sharp"; }`;

const SHARED: Fixture[] = [
  { name: "default", classes: ["icon", "icon-symbol-home"] },
  { name: "style-outlined", classes: ["icon", "icon-outlined", "icon-symbol-home"] },
  { name: "style-rounded", classes: ["icon", "icon-rounded", "icon-symbol-home"] },
  { name: "style-sharp", classes: ["icon", "icon-sharp", "icon-symbol-home"] },
  { name: "hover-fill", classes: ["icon", "hover:icon-fill", "icon-symbol-home"] },
  { name: "bold", classes: ["icon", "icon-bold", "icon-symbol-home"] },
  { name: "numeric-size", classes: ["icon", "icon-8", "icon-symbol-home"] },
  { name: "iconic", classes: ["icon", "iconic", "icon-symbol-home"], css: ICONIC },
  { name: "five-digit-codepoint", classes: ["icon", "icon-symbol-2d_2", "icon-symbol-home"] },
];

const V3: Fixture[] = [
  ...SHARED,
  {
    name: "custom-defaults",
    classes: ["icon", "icon-symbol-home"],
    theme: {
      extend: {
        icon: {
          font: { DEFAULT: "'Material Symbols Rounded'" },
          wght: { DEFAULT: "300" },
        },
      },
    },
  },
];

const V4: Fixture[] = [
  ...SHARED,
  {
    name: "custom-theme",
    classes: ["icon", "icon-opsz-2xl", "icon-heavy", "icon-symbol-home", "icon-symbol-2d_2"],
    css: `@theme {
  --default-icon-font: var(--icon-font-rounded);
  --icon-opsz-2xl: 48;
  --icon-wght-heavy: 650;
}`,
  },
];

const fixturesDir = resolve(import.meta.dirname, "fixtures");
const packageDir = resolve(import.meta.dirname, "..");

// `tailwindcss` resolves to v3 in this package. `@tailwindcss/node` depends on v4.
const requireV4 = createRequire(createRequire(import.meta.url).resolve("@tailwindcss/node"));
const tailwindV4Dir = dirname(requireV4.resolve("tailwindcss/package.json"));

async function buildV3(fixture: Fixture): Promise<string> {
  const config: Config = {
    content: [{ raw: fixture.classes.join(" "), extension: "html" }],
    corePlugins: { preflight: false },
    plugins: [materialSymbols],
    theme: fixture.theme,
  };
  const input = `@tailwind base;\n@tailwind utilities;\n${fixture.css ?? ""}\n`;
  const result = await postcss([tailwindcssV3(config)]).process(input, { from: undefined });
  return result.css;
}

async function buildV4(fixture: Fixture): Promise<string> {
  const input = [
    `@import "${tailwindV4Dir}/theme.css" layer(theme);`,
    `@import "${tailwindV4Dir}/utilities.css" layer(utilities);`,
    `@import "${packageDir}/src/index.css";`,
    fixture.css ?? "",
  ].join("\n");
  const compiler = await compile(input, { base: packageDir, onDependency: () => {} });
  return compiler.build(fixture.classes);
}

function minifyV3(css: string): string {
  const { code } = transform({ filename: "input.css", code: Buffer.from(css), minify: true });
  return code.toString();
}

function minifyV4(css: string): string {
  return optimize(css, { minify: true }).code;
}

async function writeFixtures(
  version: "v3" | "v4",
  fixtures: Fixture[],
  build: (fixture: Fixture) => Promise<string>,
  minify: (css: string) => string,
) {
  const dir = resolve(fixturesDir, version);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const fixture of fixtures) {
    const css = await build(fixture);
    await writeFile(resolve(dir, `${fixture.name}.css`), css);
    await writeFile(resolve(dir, `${fixture.name}.min.css`), minify(css) + "\n");
  }
  console.log(`Wrote ${fixtures.length * 2} ${version} fixtures to ${dir}`);
}

await writeFixtures("v3", V3, buildV3, minifyV3);
await writeFixtures("v4", V4, buildV4, minifyV4);
