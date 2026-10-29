// Picks the next version and writes the pull request body for a release.
// Used by `.github/workflows/release.yml`, which bumps `package.json`, regenerates the changelog
// and opens the release pull request.
//
// - `auto` reads the commits since the last release (Conventional Commits). Removed icon names
//   count as a breaking change. Before 1.0, a breaking change bumps the minor version and
//   everything else the patch version, as the releases so far did.
// - A release is worth publishing if a commit changes the package for its users (`feat`, `fix`,
//   `perf`, `revert`, a runtime dependency update or a breaking change) or `material-symbols`
//   changed. Chores, docs, CI and development dependency updates don't need one. A package that
//   is at a prerelease version is promoted by hand, not by the weekly run.
// - The version must not have a tag yet: publish.yml would skip it.
//
// Usage: node scripts/prepare-release.ts
// Reads `LAST_TAG` (the last stable release tag), `BUMP` (`auto`, `patch`, `minor` or `major`,
// default `auto`), `VERSION` (an exact version, overrides `BUMP`), `ONLY_IF_NEEDED` (`true` to do
// nothing unless a release is worth publishing), `NAMES_DIFF` (path to the `names-diff.json`
// written by `diff-codepoints.ts`, if `material-symbols` changed since the last release),
// `MATERIAL_SYMBOLS_NEW` (the `material-symbols` version, if the last release didn't depend on it),
// `PACKAGE_JSON` and `PR_BODY_FILE`. Prints the result as JSON and writes `release`, `version`,
// `tag` and `removed` to `GITHUB_OUTPUT`.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import type { NamesDiff } from "./dependabot-auto-merge";

export type Bump = "patch" | "minor" | "major";

export interface Commit {
  subject: string;
  body: string;
}

const CONVENTIONAL = /^(\w+)(?:\(([^)]*)\))?(!)?: /;
const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;
const LIST_LIMIT = 50;

export function isBreaking(commit: Commit): boolean {
  return (
    CONVENTIONAL.exec(commit.subject)?.[3] === "!" || /^BREAKING[ -]CHANGE: /m.test(commit.body)
  );
}

/** Changes that reach the users of the package. */
export function isUserFacing(commit: Commit): boolean {
  const match = CONVENTIONAL.exec(commit.subject);
  if (!match) return false;
  const type = match[1] ?? "";
  const scope = match[2];
  return ["feat", "fix", "perf", "revert"].includes(type) || (type === "build" && scope === "deps");
}

function parse(version: string): [number, number, number] {
  const match = VERSION.exec(version);
  if (!match) throw new Error(`Not a version: ${JSON.stringify(version)}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isPrerelease(version: string): boolean {
  parse(version);
  return version.includes("-");
}

/** Like `npm version`: a prerelease of the next version is released as that version. */
export function bumpVersion(version: string, bump: Bump): string {
  const [major, minor, patch] = parse(version);
  const prerelease = isPrerelease(version);
  if (bump === "major") {
    return prerelease && minor === 0 && patch === 0 ? `${major}.0.0` : `${major + 1}.0.0`;
  }
  if (bump === "minor") {
    return prerelease && patch === 0 ? `${major}.${minor}.0` : `${major}.${minor + 1}.0`;
  }
  return prerelease ? `${major}.${minor}.${patch}` : `${major}.${minor}.${patch + 1}`;
}

export function autoBump(
  version: string,
  commits: Commit[],
  removedNames: number,
): { bump: Bump; reason: string } {
  const [major] = parse(version);
  const breaking =
    removedNames > 0
      ? `icon names removed: ${removedNames}`
      : commits.some(isBreaking)
        ? "breaking change in the commits"
        : undefined;
  if (breaking) {
    return major === 0
      ? { bump: "minor", reason: `${breaking}, a minor version before 1.0` }
      : { bump: "major", reason: breaking };
  }
  if (major > 0 && commits.some((commit) => CONVENTIONAL.exec(commit.subject)?.[1] === "feat")) {
    return { bump: "minor", reason: "new features" };
  }
  return { bump: "patch", reason: "no breaking changes" };
}

function names(list: string[]): string {
  const shown = list.slice(0, LIST_LIMIT).map((name) => `\`${name}\``);
  if (list.length > LIST_LIMIT) shown.push(`and ${list.length - LIST_LIMIT} more`);
  return shown.join(", ");
}

export interface BodyInput {
  version: string;
  /** How the version was chosen, e.g. "patch (no breaking changes)". */
  how: string;
  lastTag: string;
  commits: Commit[];
  namesDiff?: NamesDiff;
  /** The `material-symbols` version, if the last release didn't depend on it yet. */
  newDependency?: string;
}

export function pullRequestBody({
  version,
  how,
  lastTag,
  commits,
  namesDiff,
  newDependency,
}: BodyInput): string {
  const lines = [
    `Release **${version}**: ${how}.`,
    "",
    `Merging this pull request publishes ${version} to npm, tags it and creates the GitHub release. The changelog in this pull request is generated from the commits since ${lastTag}.`,
  ];
  if (namesDiff) {
    lines.push(
      "",
      `## material-symbols ${namesDiff.base} → ${namesDiff.head}`,
      "",
      `Icon names: ${namesDiff.added.length} added, ${namesDiff.removed.length} removed.`,
    );
    if (namesDiff.added.length > 0) lines.push("", `**Added:** ${names(namesDiff.added)}`);
    if (namesDiff.removed.length > 0) {
      lines.push(
        "",
        `**Removed:** ${names(namesDiff.removed)}`,
        "",
        "Removed names break the `icon-symbol-*` utilities for anyone using them, so this release is a breaking change.",
      );
    }
  }
  if (newDependency) {
    lines.push(
      "",
      `## material-symbols ${newDependency}`,
      "",
      `${lastTag} didn't depend on \`material-symbols\` yet, so there is no diff of the icon names. Compare them with the previous release by hand: removed names break the \`icon-symbol-*\` utilities.`,
    );
  }
  const subjects = commits.map((commit) => commit.subject);
  lines.push("", `## Commits since ${lastTag}`, "");
  lines.push(...subjects.slice(0, LIST_LIMIT).map((subject) => `- ${subject}`));
  if (subjects.length > LIST_LIMIT) lines.push(`- and ${subjects.length - LIST_LIMIT} more`);
  return `${lines.join("\n")}\n`;
}

function readCommits(lastTag: string): Commit[] {
  const log = execFileSync("git", ["log", `${lastTag}..HEAD`, "--format=%s%x1f%b%x1e"], {
    encoding: "utf8",
  });
  return log
    .split("\x1e")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [subject = "", body = ""] = entry.split("\x1f");
      return { subject: subject.trim(), body: body.trim() };
    })
    .filter((commit) => !commit.subject.startsWith("chore: bump version"));
}

function tagExists(tag: string): boolean {
  try {
    execFileSync("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function writeOutput(name: string, value: string): void {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

if (import.meta.main) {
  const lastTag = process.env.LAST_TAG;
  if (!lastTag) throw new Error("LAST_TAG is not set");
  const packageJson =
    process.env.PACKAGE_JSON || "packages/tailwindcss-material-symbols/package.json";
  const current: string = JSON.parse(readFileSync(packageJson, "utf8")).version;
  const namesDiffPath = process.env.NAMES_DIFF;
  const namesDiff: NamesDiff | undefined =
    namesDiffPath && existsSync(namesDiffPath)
      ? JSON.parse(readFileSync(namesDiffPath, "utf8"))
      : undefined;
  const newDependency = process.env.MATERIAL_SYMBOLS_NEW || undefined;
  const commits = readCommits(lastTag);
  const onlyIfNeeded = process.env.ONLY_IF_NEEDED === "true";

  // A prerelease is promoted by hand, so the weekly run leaves it alone.
  const needed =
    !isPrerelease(current) &&
    (commits.some((commit) => isUserFacing(commit) || isBreaking(commit)) ||
      namesDiff !== undefined ||
      newDependency !== undefined);
  if (commits.length === 0 || (onlyIfNeeded && !needed)) {
    if (!onlyIfNeeded) throw new Error(`Nothing to release: no commits since ${lastTag}`);
    console.log(JSON.stringify({ release: false, commits: commits.length }));
    writeOutput("release", "false");
    process.exit(0);
  }

  const removed = namesDiff?.removed.length ?? 0;
  let version: string;
  let how: string;
  const exact = process.env.VERSION;
  const input = process.env.BUMP || "auto";
  if (exact) {
    parse(exact);
    version = exact;
    how = "the version was set by hand";
  } else if (input === "auto") {
    const { bump, reason } = autoBump(current, commits, removed);
    version = bumpVersion(current, bump);
    how = `${bump} bump from ${current}, ${reason}`;
  } else if (input === "patch" || input === "minor" || input === "major") {
    version = bumpVersion(current, input);
    how = `${input} bump from ${current}, chosen by hand`;
    if (removed > 0 && input !== "major")
      how += ` (icon names removed: ${removed}, a breaking change)`;
  } else {
    throw new Error(`Unknown bump: ${input}`);
  }

  if (tagExists(`v${version}`)) {
    throw new Error(`The tag v${version} exists already, so merging would not publish it`);
  }
  const body = pullRequestBody({ version, how, lastTag, commits, namesDiff, newDependency });
  if (process.env.PR_BODY_FILE) writeFileSync(process.env.PR_BODY_FILE, body);
  console.log(JSON.stringify({ release: true, version, how, removed, commits: commits.length }));
  writeOutput("release", "true");
  writeOutput("version", version);
  writeOutput("tag", `v${version}`);
  writeOutput("removed", String(removed));
}
