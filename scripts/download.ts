import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import version from "../packages/tailwindcss-material-symbols/version.json";

export const ASSETS_DIR = "../packages/tailwindcss-material-symbols/assets";

export const VARIANTS = ["outlined", "rounded", "sharp"] as const;

export const OUTPUT_FONT_NAMES = {
  outlined: "material-symbols-outlined.woff2",
  rounded: "material-symbols-rounded.woff2",
  sharp: "material-symbols-sharp.woff2",
};

export const SOURCE_FONT_PATHS = {
  outlined: "variablefont/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].woff2",
  rounded: "variablefont/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].woff2",
  sharp: "variablefont/MaterialSymbolsSharp[FILL,GRAD,opsz,wght].woff2",
};

export const CODEPOINTS_PATH =
  "variablefont/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].codepoints";

export function getRawBaseUrl(commit: string): string {
  return `https://raw.githubusercontent.com/google/material-design-icons/${commit}`;
}

export async function validateCurrentVersion(): Promise<boolean> {
  try {
    await stat(ASSETS_DIR);
  } catch {
    return false;
  }
  for (const variant of VARIANTS) {
    try {
      const path = resolve(import.meta.dirname, ASSETS_DIR, OUTPUT_FONT_NAMES[variant]);
      const data = await readFile(path);
      const actualHash = createHash("sha256").update(data).digest("hex");
      if (actualHash != version.hashes[variant]) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export async function downloadMaterialSymbols(commit: string): Promise<Record<string, string>> {
  await rm(ASSETS_DIR, { recursive: true, force: true });
  await mkdir(ASSETS_DIR);
  const baseUrl = getRawBaseUrl(commit);
  const hashes: Record<(typeof VARIANTS)[number], string> = {} as any;
  for (const variant of VARIANTS) {
    const sourceUrl = `${baseUrl}/${SOURCE_FONT_PATHS[variant]}`;
    const outputPath = resolve(import.meta.dirname, ASSETS_DIR, OUTPUT_FONT_NAMES[variant]);
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download ${variant} font: ${response.status} ${response.statusText}`,
      );
    }
    const data = Buffer.from(await response.arrayBuffer());
    hashes[variant] = createHash("sha256").update(data).digest("hex");
    await writeFile(outputPath, data);
  }
  return hashes;
}

export async function fetchCodepoints(commit: string): Promise<Record<string, string>> {
  const baseUrl = getRawBaseUrl(commit);
  const response = await fetch(`${baseUrl}/${CODEPOINTS_PATH}`);
  if (!response.ok) {
    throw new Error(`Failed to download codepoints: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line)
      .map((line) => {
        const parts = line.split(" ");
        if (parts.length !== 2) throw new Error(`Invalid codepoints line: ${line}`);
        const [name, codepoint] = parts;
        if (!/^\w+$/i.test(name) || !/^[0-9a-f]{4}$/i.test(codepoint))
          throw new Error(`Invalid codepoint line: ${line}`);
        return [name, codepoint];
      }),
  );
}

if (import.meta.main) {
  const isUpToDate = await validateCurrentVersion();
  if (isUpToDate) {
    console.log("Material Symbols assets are up to date.");
    process.exit(0);
  }

  console.log("Downloading fonts...");
  const hashes = await downloadMaterialSymbols(version.commit);
  for (const variant of VARIANTS) {
    if (hashes[variant] !== version.hashes[variant]) {
      console.warn(
        `Hash mismatch for ${variant} font. Expected ${version.hashes[variant]}, got ${hashes[variant]}`,
      );
    }
  }

  console.log("Download complete.");
  process.exit(0);
}
