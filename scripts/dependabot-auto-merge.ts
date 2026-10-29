// Decides whether a Dependabot pull request is merged automatically once the required checks pass.
// Used by `.github/workflows/dependabot-auto-merge.yml`.
//
// - `material-symbols`: merge if no icon names are removed. Removed names are a breaking change for
//   users of the `icon-symbol-*` utilities, so those pull requests get the `icons-removed` label.
// - devDependencies and GitHub Actions: merge patch and minor updates.
// - Everything else (runtime dependencies such as `subset-font`, major updates): manual.
//
// Usage: node scripts/dependabot-auto-merge.ts
// Reads `UPDATED_DEPENDENCIES_JSON` (the `updated-dependencies-json` output of
// `dependabot/fetch-metadata`), `NAMES_DIFF` (path to the `names-diff.json` written by
// `diff-codepoints.ts`, if any) and `MATERIAL_SYMBOLS_SPEC` (the `material-symbols` version in the
// pull request's package.json). Prints the decision as JSON, writes `action` and `message` to
// `GITHUB_OUTPUT` and the message to the job summary.
import { appendFileSync, existsSync, readFileSync } from "node:fs";

export const MATERIAL_SYMBOLS = "material-symbols";

/** The fields of `dependabot/fetch-metadata`'s `updated-dependencies-json` that the rules use. */
export interface UpdatedDependency {
  dependencyName: string;
  /** `direct:production`, `direct:development` or `indirect`. */
  dependencyType: string;
  /** `version-update:semver-major`, `-minor` or `-patch`. Empty if Dependabot couldn't tell. */
  updateType?: string;
  /** `npm_and_yarn` or `github_actions`. */
  packageEcosystem: string;
  prevVersion?: string;
  newVersion?: string;
}

/** The output of `packages/tailwindcss-material-symbols/scripts/diff-codepoints.ts`. */
export interface NamesDiff {
  base: string;
  head: string;
  added: string[];
  removed: string[];
}

export type Action = "merge" | "manual" | "icons-removed";

export interface Decision {
  action: Action;
  /** One line per dependency that isn't merged automatically, or why the pull request is merged. */
  reasons: string[];
  /** Removed icon names, if `material-symbols` is updated. */
  removed: string[];
}

export interface Context {
  namesDiff?: NamesDiff;
  /** The `material-symbols` version in the pull request's package.json. */
  materialSymbolsSpec?: string;
}

const AUTO_UPDATE_TYPES = new Set(["version-update:semver-minor", "version-update:semver-patch"]);

function check(
  dependency: UpdatedDependency,
  { namesDiff, materialSymbolsSpec }: Context,
): { action: Action; reason?: string; removed?: string[] } {
  const name = dependency.dependencyName;
  const update = `${name} ${dependency.prevVersion || "?"} → ${dependency.newVersion || "?"}`;

  if (name === MATERIAL_SYMBOLS && dependency.packageEcosystem === "npm_and_yarn") {
    if (!namesDiff) return { action: "manual", reason: `${update}: no names diff` };
    if (namesDiff.removed.length > 0) {
      return {
        action: "icons-removed",
        reason: `${update}: removes ${namesDiff.removed.length} icon names`,
        removed: namesDiff.removed,
      };
    }
    // The package depends on an exact version, so a bump changes the fonts users get. A range
    // would let them resolve versions the names diff hasn't checked.
    if (!materialSymbolsSpec || !/^\d+\.\d+\.\d+$/.test(materialSymbolsSpec)) {
      return {
        action: "manual",
        reason: `${update}: package.json has ${JSON.stringify(materialSymbolsSpec ?? null)}, not an exact version`,
      };
    }
  }

  if (!dependency.updateType || !AUTO_UPDATE_TYPES.has(dependency.updateType)) {
    return {
      action: "manual",
      reason: `${update}: ${dependency.updateType?.replace("version-update:", "") || "unknown update type"}`,
    };
  }

  if (name === MATERIAL_SYMBOLS) return { action: "merge" };
  if (dependency.packageEcosystem === "github_actions") return { action: "merge" };
  if (
    dependency.packageEcosystem === "npm_and_yarn" &&
    dependency.dependencyType === "direct:development"
  ) {
    return { action: "merge" };
  }
  return { action: "manual", reason: `${update}: ${dependency.dependencyType} dependency` };
}

export function decide(dependencies: UpdatedDependency[], context: Context = {}): Decision {
  if (dependencies.length === 0) {
    return { action: "manual", reasons: ["No updated dependencies in the metadata"], removed: [] };
  }
  const results = dependencies.map((dependency) => check(dependency, context));
  const reasons = results.flatMap((result) => (result.reason ? [result.reason] : []));
  const removed = results.flatMap((result) => result.removed ?? []);
  if (results.some((result) => result.action === "icons-removed")) {
    return { action: "icons-removed", reasons, removed };
  }
  if (results.some((result) => result.action === "manual")) {
    return { action: "manual", reasons, removed };
  }
  return {
    action: "merge",
    reasons: ["Patch or minor update without removed icon names"],
    removed,
  };
}

/** The pull request comment or job summary for a decision. */
export function message(decision: Decision): string {
  if (decision.action === "merge") {
    return "Auto-merge is enabled. The pull request is merged once the required checks pass.";
  }
  const lines = [
    "Not merged automatically:",
    "",
    ...decision.reasons.map((reason) => `- ${reason}`),
  ];
  if (decision.removed.length > 0) {
    lines.push(
      "",
      `**Removed icon names (${decision.removed.length}):** ${decision.removed.map((name) => `\`${name}\``).join(", ")}`,
      "",
      "These break the `icon-symbol-*` utilities for anyone using them, so the release that includes this update is a breaking change.",
    );
  }
  return lines.join("\n");
}

function writeOutput(name: string, value: string): void {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  const delimiter = `EOF_${Math.random().toString(36).slice(2)}`;
  appendFileSync(file, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}

if (import.meta.main) {
  const dependencies: UpdatedDependency[] = JSON.parse(
    process.env.UPDATED_DEPENDENCIES_JSON || "[]",
  );
  const namesDiffPath = process.env.NAMES_DIFF;
  const namesDiff: NamesDiff | undefined =
    namesDiffPath && existsSync(namesDiffPath)
      ? JSON.parse(readFileSync(namesDiffPath, "utf8"))
      : undefined;
  const materialSymbolsSpec = process.env.MATERIAL_SYMBOLS_SPEC || undefined;

  const decision = decide(dependencies, { namesDiff, materialSymbolsSpec });
  console.log(JSON.stringify(decision, null, 2));
  writeOutput("action", decision.action);
  writeOutput("message", message(decision));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message(decision)}\n`);
  }
}
