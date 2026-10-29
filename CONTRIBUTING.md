# Contributing

Thanks for helping improve `@janispritzkau/tailwindcss-material-symbols`. This guide covers the development setup, the scripts, how the upstream fonts are updated, and how releases are published.

## Requirements

- **Node.js 22.18 or newer.** The scripts rely on `import.meta.main`. CI uses Node 22 and 24.
- **pnpm 12.** The exact version is pinned in `packageManager` in the root `package.json`, and CI uses it too. With [Corepack](https://github.com/nodejs/corepack) enabled, or a pnpm that manages its own version, you get it automatically.

## Setup

```bash
pnpm install
pnpm build
```

`pnpm build` generates the codepoint maps from the fonts (see [Fonts and codepoints](#fonts-and-codepoints)), builds the package and type-checks the repository. It doesn't need the network after `pnpm install`. You need to build before the example works, because it uses the package's `dist` output.

## Repository layout

- `packages/tailwindcss-material-symbols/`: the published package
  - `src/index.css`: Tailwind v4 theme and utilities
  - `src/v3/`: deprecated Tailwind v3 plugin, exported as `./v3` and as the `node` condition of `.`. Its detection rules are in `src/detect-v3.ts`. To remove v3 support, delete both, the `./v3` export and the v3 test fixtures.
  - `src/vite.ts`: Vite plugin
  - `src/subset.ts`: font subsetting, used by the Vite plugin and the CLI
  - `src/font-face.ts`: `@font-face` rules, used by the Vite plugin and the CLI
  - `src/detect-v4.ts`, `src/detect-v3.ts`: detection of the used symbols, styles and axis values in Tailwind v4 and v3 output
  - `src/cli.ts`: `tailwindcss-material-symbols` CLI
  - `src/generated/`, `src/v3/generated/`: codepoint maps, generated from the fonts on every build and test (gitignored)
  - `scripts/`: codepoint map generator and names diff
  - `full.css`, `outlined.css`, `rounded.css`, `sharp.css`: `@font-face` rules for the full fonts
- `examples/vite/`: plain Vite + Tailwind v4 example that uses the workspace package
- `scripts/check-example.ts`: checks the example build, used by `pnpm test:example`
- `scripts/dependabot-auto-merge.ts`: decides which Dependabot pull requests are merged automatically
- `scripts/prepare-release.ts`: picks the next version and writes the body of the release pull request

The package is built with [tsdown](https://tsdown.dev). The CSS entry is not built: the `style` export points at `src/index.css`, which imports `src/generated/codepoints.css`.

## Scripts

Run these from the repository root:

| Command                | Description                                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`           | Runs `build-only` and `type-check`.                                                                                                                                         |
| `pnpm build-only`      | Generates the codepoint maps and builds the package with tsdown into `packages/tailwindcss-material-symbols/dist`.                                                          |
| `pnpm type-check`      | Runs `tsc --build` on the package sources, the scripts and the config files.                                                                                                |
| `pnpm test`            | Generates the codepoint maps, then runs the package tests and the tests of `scripts/` (`pnpm test:scripts`).                                                                |
| `pnpm test:example`    | Builds the example and checks that each font style has a small subset font (< 20 KB), and that the document font contains the shadow root's symbol. Run `pnpm build` first. |
| `pnpm format`          | Formats the repository with Prettier. `pnpm format:check` only checks.                                                                                                      |
| `pnpm changelog`       | Regenerates `CHANGELOG.md` from the commit history. Pass `--tag vX.Y.Z` to put unreleased changes under that version.                                                       |
| `pnpm publish:package` | Publishes the package to npm. Normally run by CI only.                                                                                                                      |

`pnpm test` checks the subset detection (`src/subset.ts`) against real Tailwind v3 and v4 output in `packages/tailwindcss-material-symbols/test/fixtures/`. After changing `src/v3/index.ts` or `src/index.css`, regenerate the fixtures with `pnpm --filter ./packages/tailwindcss-material-symbols generate:fixtures` and review the diff.

To check a change end to end, run `pnpm build` and build the example:

```bash
pnpm --filter ./examples/vite build
```

In the build output, you should see a small `material-symbols-<style>.woff2` asset (a few KB) for each font style the example uses. Fonts below `build.assetsInlineLimit` are inlined into the CSS instead. `pnpm test:example` builds the example and checks this for you.

To try the example in the browser:

```bash
pnpm --filter ./examples/vite dev
pnpm --filter ./examples/vite preview # after a build
```

The example loads the package from `dist`. After you change the package source, run `pnpm build-only` again.

## Fonts and codepoints

The fonts come from the [`material-symbols`](https://www.npmjs.com/package/material-symbols) package, pinned to an exact version in `packages/tailwindcss-material-symbols/package.json`. The name → codepoint maps aren't committed: `scripts/generate-codepoints.ts` (`pnpm --filter ./packages/tailwindcss-material-symbols generate:codepoints`, run by the package's `build` and `test`) reads them from the fonts' ligature and cmap tables, fails if the three styles disagree or a ligature has no codepoint, and prints the number of names and the names added or removed since its previous run. To update the fonts, bump the `material-symbols` version. On pull requests, CI lists the added and removed names in the job summary of the `names-diff` job (`scripts/diff-codepoints.ts`) and warns about removed names, which are a breaking change.

Dependabot ([`.github/dependabot.yml`](.github/dependabot.yml)) opens the updates. [`.github/workflows/dependabot-auto-merge.yml`](.github/workflows/dependabot-auto-merge.yml) enables auto-merge, so they're merged once CI passes, for `material-symbols` bumps that remove no names and for patch and minor updates of devDependencies and GitHub Actions. Updates that aren't merged automatically get a comment that mentions the repository owner, with the reasons. Bumps that remove names also get the `icons-removed` label and the names in the comment. Runtime dependencies and majors are left for review. The commit messages of the updates use Conventional Commits (`build(deps):`, `build(deps-dev):`, `ci(deps):`), so they show up in the changelog. Merged updates reach users only with the next release.

## Releasing

Releases are prepared by GitHub Actions and published when you merge a pull request. You don't need an editor or a terminal.

1. [`.github/workflows/release.yml`](.github/workflows/release.yml) opens the pull request `chore: bump version to X.Y.Z` from the branch `release/next` and requests your review. It bumps `version` in `packages/tailwindcss-material-symbols/package.json`, regenerates the changelog and lists the icon names added and removed since the last release. Removed names also add the `icons-removed` label.
   - A weekly run (Mondays, 06:00 UTC) does this only if a release is worth publishing: a `feat`, `fix`, `perf` or `revert` commit, a breaking change, a runtime dependency update (`build(deps):`) or a new `material-symbols` version since the last release. It leaves an open release pull request alone, and it does nothing while the package is at a prerelease version.
   - To release now, or to refresh the open pull request, run **Actions → Release → Run workflow**. `bump: auto` reads the commits (`scripts/prepare-release.ts`). Before 1.0 it bumps the patch version, and the minor version for breaking changes, which include removed icon names. Choose `patch`, `minor` or `major` to override it, or enter an exact `version` such as `0.1.0-alpha.0`. The run fails if the tag for the version exists already. From a prerelease, `auto` and `patch` release its stable version.
   - Run it again before you merge if commits landed since: the changelog in the pull request is generated when the workflow runs, but the release contains everything on `main` at the merge.
2. Review the pull request and merge it. Squash-merge it and keep its title.
3. [`.github/workflows/publish.yml`](.github/workflows/publish.yml) sees a push to `main` with a `chore: bump version to ` commit and a version that has no tag yet. It runs `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test` and `pnpm publish:package` with Node 22. Prereleases (versions with a `-`, such as `0.1.0-alpha.0`) are published with the `next` dist-tag, all other versions with `latest`. It authenticates to npm with GitHub OIDC (`id-token: write`), so it doesn't need an npm token. Then it creates the tag and a GitHub release with the same notes as the changelog.

The pull request needs these settings:

- **Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"**: on.
- A pull request opened with `GITHUB_TOKEN` doesn't start the `pull_request` workflows, so the release workflow starts CI (`workflow_dispatch`) on `release/next`. If the required `ci` check doesn't pass for the pull request, merge it as an administrator and fix that.

To release by hand, do the same steps yourself: bump `version`, run `pnpm changelog --tag vX.Y.Z`, commit both as `chore: bump version to X.Y.Z`, then tag and push:

```bash
git tag vX.Y.Z
git push origin main vX.Y.Z
```

Pushing a `v*` tag also publishes. The workflow fails if the tag isn't `v` followed by the `version` in `packages/tailwindcss-material-symbols/package.json`.

### Changelog

[`CHANGELOG.md`](CHANGELOG.md) is generated from the commit history with [git-cliff](https://git-cliff.org) ([`cliff.toml`](cliff.toml)). Don't edit it by hand: the next `pnpm changelog` overwrites it. Only Conventional Commits appear in it, grouped by type, so the commit message is the changelog entry. `chore: bump version` commits and merge commits are left out. Prerelease tags such as `v0.1.0-alpha.0` don't get their own section.

## Pull requests

- Branch from `main` and keep each pull request focused on one change.
- Use [Conventional Commits](https://www.conventionalcommits.org) prefixes for commit messages, as the history does: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Run `pnpm format`, `pnpm build`, `pnpm test`, and `pnpm test:example` before you open a pull request. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the same checks on every pull request, with Node 22 and 24 and with Vite 7 and 8 in the example.
- If you change utilities or options, update the [package README](packages/tailwindcss-material-symbols/README.md). The package README is the documentation published on npm.
