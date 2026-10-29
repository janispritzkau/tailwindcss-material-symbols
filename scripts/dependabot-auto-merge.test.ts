import assert from "node:assert/strict";
import { test } from "node:test";
import { decide, message, type NamesDiff, type UpdatedDependency } from "./dependabot-auto-merge";

// Shaped like the `updated-dependencies-json` output of `dependabot/fetch-metadata`.
function npm(
  dependencyName: string,
  dependencyType: string,
  updateType: string,
  prevVersion = "1.0.0",
  newVersion = "1.0.1",
): UpdatedDependency {
  return {
    dependencyName,
    dependencyType,
    updateType: `version-update:semver-${updateType}`,
    packageEcosystem: "npm_and_yarn",
    prevVersion,
    newVersion,
  };
}

const materialSymbols = npm("material-symbols", "direct:production", "patch", "0.48.2", "0.48.3");
const diff = (removed: string[]): NamesDiff => ({
  base: "0.48.2",
  head: "0.48.3",
  added: ["new_icon"],
  removed,
});

test("merges material-symbols without removed names", () => {
  const decision = decide([materialSymbols], {
    namesDiff: diff([]),
    materialSymbolsSpec: "0.48.3",
  });
  assert.equal(decision.action, "merge");
});

test("labels material-symbols with removed names and lists them", () => {
  const decision = decide([materialSymbols], {
    namesDiff: diff(["old_icon", "other_icon"]),
    materialSymbolsSpec: "0.48.3",
  });
  assert.equal(decision.action, "icons-removed");
  assert.deepEqual(decision.removed, ["old_icon", "other_icon"]);
  assert.match(message(decision), /`old_icon`, `other_icon`/);
});

test("doesn't merge material-symbols without a names diff", () => {
  assert.equal(decide([materialSymbols], { materialSymbolsSpec: "0.48.3" }).action, "manual");
});

test("doesn't merge material-symbols if the pin became a range", () => {
  const decision = decide([materialSymbols], {
    namesDiff: diff([]),
    materialSymbolsSpec: "^0.48.3",
  });
  assert.equal(decision.action, "manual");
});

test("doesn't merge a material-symbols major", () => {
  const major = npm("material-symbols", "direct:production", "major", "0.48.2", "1.0.0");
  const decision = decide([major], { namesDiff: diff([]), materialSymbolsSpec: "1.0.0" });
  assert.equal(decision.action, "manual");
});

test("merges devDependency minor and patch updates", () => {
  const decision = decide([
    npm("prettier", "direct:development", "minor"),
    npm("tsx", "direct:development", "patch"),
  ]);
  assert.equal(decision.action, "merge");
});

test("doesn't merge devDependency majors", () => {
  assert.equal(decide([npm("vite", "direct:development", "major")]).action, "manual");
});

test("doesn't merge a group if one update is manual", () => {
  const decision = decide([
    npm("prettier", "direct:development", "minor"),
    npm("typescript", "direct:development", "major", "5.9.3", "6.0.0"),
  ]);
  assert.equal(decision.action, "manual");
  assert.deepEqual(decision.reasons, ["typescript 5.9.3 → 6.0.0: semver-major"]);
});

test("doesn't merge runtime dependencies", () => {
  assert.equal(decide([npm("subset-font", "direct:production", "major")]).action, "manual");
  assert.equal(decide([npm("subset-font", "direct:production", "minor")]).action, "manual");
});

test("doesn't merge indirect dependencies", () => {
  assert.equal(decide([npm("brace-expansion", "indirect", "patch")]).action, "manual");
});

test("merges GitHub Actions minor updates, not majors", () => {
  const action = (updateType: string): UpdatedDependency => ({
    dependencyName: "actions/checkout",
    dependencyType: "direct:production",
    updateType: `version-update:semver-${updateType}`,
    packageEcosystem: "github_actions",
  });
  assert.equal(decide([action("minor")]).action, "merge");
  assert.equal(decide([action("major")]).action, "manual");
});

test("doesn't merge without an update type or metadata", () => {
  const unknown = { ...npm("prettier", "direct:development", "patch"), updateType: "" };
  assert.equal(decide([unknown]).action, "manual");
  assert.equal(decide([]).action, "manual");
});
