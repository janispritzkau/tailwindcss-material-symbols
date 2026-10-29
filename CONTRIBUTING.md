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
  - `src/detect-v4.ts`, `src/detect-v3.ts`: detection of the used symbols, styles and axis values in Tailwind v4 and v3 output
  - `src/cli.ts`: `tailwindcss-material-symbols` CLI
  - `src/generated/`, `src/v3/generated/`: codepoint maps, generated from the fonts on every build and test (gitignored)
  - `scripts/`: codepoint map generator and names diff
  - `full.css`, `outlined.css`, `rounded.css`, `sharp.css`: `@font-face` rules for the full fonts
- `examples/vite/`: plain Vite + Tailwind v4 example that uses the workspace package
- `scripts/check-example.ts`: checks the example build, used by `pnpm test:example`

The package is built with [tsdown](https://tsdown.dev). The CSS entry is not built: the `style` export points at `src/index.css`, which imports `src/generated/codepoints.css`.

## Scripts

Run these from the repository root:

| Command                | Description                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`           | Runs `build-only` and `type-check`.                                                                                   |
| `pnpm build-only`      | Generates the codepoint maps and builds the package with tsdown into `packages/tailwindcss-material-symbols/dist`.    |
| `pnpm type-check`      | Runs `tsc --build` on the package sources, the scripts and the config files.                                          |
| `pnpm test`            | Generates the codepoint maps, then runs the package tests.                                                            |
| `pnpm test:example`    | Builds the example and checks that each font style has a small subset font (< 20 KB). Run `pnpm build` first.         |
| `pnpm format`          | Formats the repository with Prettier. `pnpm format:check` only checks.                                                |
| `pnpm changelog`       | Regenerates `CHANGELOG.md` from the commit history. Pass `--tag vX.Y.Z` to put unreleased changes under that version. |
| `pnpm publish:package` | Publishes the package to npm. Normally run by CI only.                                                                |

`pnpm test` checks the subset detection (`src/subset.ts`) against real Tailwind v3 and v4 output in `packages/tailwindcss-material-symbols/test/fixtures/`. After changing `src/v3/index.ts` or `src/index.css`, regenerate the fixtures with `pnpm --filter ./packages/tailwindcss-material-symbols generate:fixtures` and review the diff.

To check a change end to end, run `pnpm build` and build the example:

```bash
pnpm --filter ./examples/vite build
```

In the build output, you should see a small `material-symbols-<style>.woff2` asset (a few KB) for each font style the example uses. `pnpm test:example` builds the example and checks this for you.

To try the example in the browser:

```bash
pnpm --filter ./examples/vite dev
pnpm --filter ./examples/vite preview # after a build
```

The example loads the package from `dist`. After you change the package source, run `pnpm build-only` again.

## Fonts and codepoints

The fonts come from the [`material-symbols`](https://www.npmjs.com/package/material-symbols) package, pinned to an exact version in `packages/tailwindcss-material-symbols/package.json`. The name → codepoint maps aren't committed: `scripts/generate-codepoints.ts` (`pnpm --filter ./packages/tailwindcss-material-symbols generate:codepoints`, run by the package's `build` and `test`) reads them from the fonts' ligature and cmap tables, fails if the three styles disagree or a ligature has no codepoint, and prints the number of names and the names added or removed since its previous run. To update the fonts, bump the `material-symbols` version. On pull requests, CI lists the added and removed names in the job summary of the `names-diff` job (`scripts/diff-codepoints.ts`) and warns about removed names, which are a breaking change.

## Releasing

Releases are published from GitHub Actions ([`.github/workflows/publish.yml`](.github/workflows/publish.yml)) when a `v*` tag is pushed:

1. Bump `version` in `packages/tailwindcss-material-symbols/package.json`.
2. Update the changelog for the new version:

   ```bash
   pnpm changelog --tag v0.1.0
   ```

3. Commit both changes, for example `chore: bump version to 0.1.0`.
4. Tag the commit and push the commit and the tag:

   ```bash
   git tag v0.1.0
   git push origin main v0.1.0
   ```

The workflow fails if the tag isn't `v` followed by the `version` in `packages/tailwindcss-material-symbols/package.json`. It runs `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test`, and `pnpm publish:package` with Node 22 and the pinned pnpm. Prereleases (versions with a `-`, such as `0.1.0-alpha.0`) are published with the `next` dist-tag, all other versions with `latest`. It authenticates to npm with GitHub OIDC (`id-token: write`), so it doesn't need an npm token. After publishing, it creates a GitHub release for the tag with the same notes as the changelog.

### Changelog

[`CHANGELOG.md`](CHANGELOG.md) is generated from the commit history with [git-cliff](https://git-cliff.org) ([`cliff.toml`](cliff.toml)). Don't edit it by hand: the next `pnpm changelog` overwrites it. Only Conventional Commits appear in it, grouped by type, so the commit message is the changelog entry. `chore: bump version` commits and merge commits are left out. Prerelease tags such as `v0.1.0-alpha.0` don't get their own section.

## Pull requests

- Branch from `main` and keep each pull request focused on one change.
- Use [Conventional Commits](https://www.conventionalcommits.org) prefixes for commit messages, as the history does: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Run `pnpm format`, `pnpm build`, `pnpm test`, and `pnpm test:example` before you open a pull request. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the same checks on every pull request, with Node 22 and 24 and with Vite 7 and 8 in the example.
- If you change utilities or options, update the [package README](packages/tailwindcss-material-symbols/README.md). The package README is the documentation published on npm.
