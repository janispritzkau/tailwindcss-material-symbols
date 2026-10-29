import assert from "node:assert/strict";
import { test } from "node:test";
import type { NamesDiff } from "./dependabot-auto-merge";
import {
  autoBump,
  bumpVersion,
  isBreaking,
  isUserFacing,
  pullRequestBody,
  type Commit,
} from "./prepare-release";

const commit = (subject: string, body = ""): Commit => ({ subject, body });

test("recognizes breaking commits", () => {
  assert.equal(isBreaking(commit("feat!: drop Node 20")), true);
  assert.equal(isBreaking(commit("feat(vite)!: rename the option")), true);
  assert.equal(isBreaking(commit("fix: x", "BREAKING CHANGE: the CSS entry moved")), true);
  assert.equal(isBreaking(commit("feat: add a thing")), false);
  assert.equal(isBreaking(commit("fix: don't break things!")), false);
});

test("recognizes changes that reach users", () => {
  for (const subject of [
    "feat: x",
    "fix(vite): x",
    "perf: x",
    "revert: x",
    "build(deps): bump subset-font from 2.4.0 to 2.4.1",
  ]) {
    assert.equal(isUserFacing(commit(subject)), true, subject);
  }
  for (const subject of [
    "chore: x",
    "docs: x",
    "ci: x",
    "refactor: x",
    "build(deps-dev): bump prettier from 3.6.2 to 3.6.3",
    "ci(deps): bump actions/checkout from 4 to 5",
    "Bump something",
  ]) {
    assert.equal(isUserFacing(commit(subject)), false, subject);
  }
});

test("bumps versions", () => {
  assert.equal(bumpVersion("0.0.10", "patch"), "0.0.11");
  assert.equal(bumpVersion("0.0.10", "minor"), "0.1.0");
  assert.equal(bumpVersion("0.4.2", "major"), "1.0.0");
  assert.equal(bumpVersion("1.2.3-alpha.1", "patch"), "1.2.4");
  assert.throws(() => bumpVersion("latest", "patch"));
});

test("auto bump before 1.0: patch, or minor for breaking changes", () => {
  assert.equal(autoBump("0.0.10", [commit("feat: x"), commit("fix: y")], 0).bump, "patch");
  assert.equal(autoBump("0.0.10", [commit("feat!: x")], 0).bump, "minor");
  assert.equal(autoBump("0.0.10", [commit("fix: y")], 3).bump, "minor");
  assert.match(autoBump("0.0.10", [commit("fix: y")], 3).reason, /icon names removed: 3/);
});

test("auto bump from 1.0: major, minor or patch", () => {
  assert.equal(autoBump("1.2.3", [commit("fix: x")], 0).bump, "patch");
  assert.equal(autoBump("1.2.3", [commit("fix: x"), commit("feat: y")], 0).bump, "minor");
  assert.equal(autoBump("1.2.3", [commit("feat: x")], 1).bump, "major");
  assert.equal(autoBump("1.2.3", [commit("fix!: x")], 0).bump, "major");
});

test("pull request body lists the icon names and the commits", () => {
  const namesDiff: NamesDiff = {
    base: "0.48.2",
    head: "0.48.3",
    added: ["new_icon"],
    removed: ["old_icon"],
  };
  const body = pullRequestBody({
    version: "0.1.0",
    how: "minor bump",
    lastTag: "v0.0.10",
    commits: [commit("feat: x"), commit("fix: y")],
    namesDiff,
  });
  assert.match(body, /Release \*\*0\.1\.0\*\*: minor bump\./);
  assert.match(body, /## material-symbols 0\.48\.2 → 0\.48\.3/);
  assert.match(body, /Icon names: 1 added, 1 removed\./);
  assert.match(body, /\*\*Removed:\*\* `old_icon`/);
  assert.match(body, /- feat: x\n- fix: y\n/);
});

test("pull request body shortens long lists and skips the names without a diff", () => {
  const commits = Array.from({ length: 60 }, (_, i) => commit(`fix: ${i}`));
  const body = pullRequestBody({ version: "0.0.11", how: "patch", lastTag: "v0.0.10", commits });
  assert.match(body, /- and 10 more/);
  assert.doesNotMatch(body, /material-symbols/);
});
