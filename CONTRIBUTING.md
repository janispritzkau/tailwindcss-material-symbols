# Contributing / Maintenance Guide

Thank you for your interest in improving `@janispritzkau/tailwindcss-material-symbols`.

This document covers:

1. Development setup
2. Updating upstream Material Symbols (fonts + codepoints)
3. Generated assets & reproducibility
4. Release workflow & versioning
5. Roadmap (CLI)

## 1. Development Setup

Requirements: Node 18+, pnpm.

Install deps:

```bash
pnpm install
```

Build the package (runs the prebuild update script):

```bash
pnpm --filter @janispritzkau/tailwindcss-material-symbols build
```

Play with the examples (v3 / v4):

```bash
pnpm --filter ./examples/tailwindcss-v3 dev
pnpm --filter ./examples/tailwindcss-v4 dev
```

## 2. Updating Material Symbols

Font files (`material-symbols-*.woff2`) and codepoint maps are fetched automatically during the package `prebuild` step by `scripts/update-material-symbols.ts`.

Script actions:

1. Download upstream codepoints file from the Material Symbols repository.
2. Query the latest upstream commit touching the `variablefont` path (GitHub API) and store its SHA.
3. Compute a SHA‑256 hash of the codepoints file and compare it (and `commitSha`) with `src/generated/meta.json`.
4. If both hash and commit SHA are unchanged, skip regeneration (fast, deterministic builds).
5. Ensure the three variable font files (outlined, rounded, sharp) exist (download only if missing, unless forced).

Force a refresh ignoring cached hash:

```bash
FORCE_MATERIAL_SYMBOLS_UPDATE=1 pnpm --filter @janispritzkau/tailwindcss-material-symbols build
```

### Tracking upstream updates

The upstream project does not publish versioned font artifacts, so this package tracks two signals:

- `commitSha` – latest commit (as reported by GitHub) for the `variablefont` directory
- `codepointsHash` – SHA‑256 of the codepoints file

Recommended automation:

1. Scheduled CI (daily) runs the build.
2. If `git diff --quiet` fails afterward, open a PR with updated generated artifacts.
3. Choose semver bump:
   - Patch: Only codepoint additions
   - Minor: Additions + internal improvements
   - Major: Breaking removals / renames (rare)

### Metadata

`src/generated/meta.json` structure:

```jsonc
{
  "codepointsHash": "<sha256>",
  "commitSha": "<git commit sha>",
  "updatedAt": "<iso timestamp>",
}
```

## 3. Generated Assets & Reproducibility

The build concatenates `src/index.css` with `src/generated/codepoints.css` into `dist/index.css` (see `tsdown.config.ts`). Fonts are downloaded only when missing (unless forced). For **offline CI** ensure fonts were previously downloaded or vendor them.

Fonts themselves can be treated as build artifacts (not required to commit if you prefer generating in CI).

## 4. Release Workflow

Steps:

1. Ensure working tree clean & tests (future) pass.
2. Run build: `pnpm --filter @janispritzkau/tailwindcss-material-symbols build`.
3. Update CHANGELOG (if added later) / summarize changes in commit.
4. Bump version in `packages/tailwindcss-material-symbols/package.json` (semantic versioning policy above).
5. Commit & tag: `git commit -am "feat: ..." && git tag vX.Y.Z`.
6. Publish (ensure you are logged in): `pnpm --filter @janispritzkau/tailwindcss-material-symbols publish --access public`.

## 5. Roadmap

- Implement CLI for cross‑tool font subsetting:
  ```bash
  tailwindcss-material-symbols subset --output dist/assets style.css
  ```
  Features: multi‑file input, JSON report mode, optional emitted CSS with `@font-face`, watch mode.

## 6. Contributing Guidelines

1. Fork & branch (`feat/`, `fix/`, or `chore/` prefix).
2. Keep PRs focused / small.
3. Include rationale in description; link to issues.
4. If touching generated logic, explain reproducibility impact.
5. Run formatting / lint if added in future (currently none enforced).
