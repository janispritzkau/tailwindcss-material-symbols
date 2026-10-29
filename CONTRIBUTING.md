# Contributing

Write commit messages as [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, …). The changelog is generated from them.

## Setup

You need Node.js 22.18 or newer and pnpm (the version is pinned in `packageManager`; [Corepack](https://github.com/nodejs/corepack) installs it).

```bash
pnpm install && pnpm build
```

`pnpm build` generates the codepoint maps from the fonts, builds the package into `dist` and type-checks. The example uses `dist`, so run `pnpm build-only` again after you change the package.

## Checking a change

```bash
pnpm test                # package and script tests
pnpm test:example        # builds examples/vite and checks its subset fonts
pnpm format:check        # `pnpm format` fixes it
pnpm --filter ./examples/vite dev   # look at the example in a browser
```

CI ([`ci.yml`](.github/workflows/ci.yml)) runs the same checks with Node 22 and 24 and with Vite 7 and 8. After you change `src/index.css` or `src/v3/index.ts`, regenerate the test fixtures with `pnpm --filter ./packages/tailwindcss-material-symbols generate:fixtures` and review the diff.

## Updating icons

The fonts come from the `material-symbols` package, pinned to an exact version. Dependabot opens the bump, and it merges automatically after CI passes. A bump that removes icon names gets the `icons-removed` label and a comment instead, and is left for review. The next release is then breaking. Merged updates reach users with the next release.

## Releasing

Run **Actions → Release → Run workflow** (a weekly run does it when a release is worth publishing). [`release.yml`](.github/workflows/release.yml) opens the pull request `chore: bump version to X.Y.Z` from `release/next`, with the changelog and the icon names added and removed. Review it and squash-merge it, keeping its title. [`publish.yml`](.github/workflows/publish.yml) then publishes to npm (prereleases such as `0.1.0-alpha.0` to the `next` dist-tag) and creates the tag and the GitHub release.

`bump: auto` reads the commits; choose `patch`, `minor` or `major`, or enter an exact `version`, to override it. Run the workflow again before merging if commits landed since. The workflow pushes and opens the pull request as a GitHub App, so that CI runs on it. The App needs to be installed on the repository with Contents, Pull requests and Issues (read and write), with its client ID in the `BOT_CLIENT_ID` Actions variable and a private key in the `BOT_PRIVATE_KEY` Actions secret.

To release by hand, bump `version` in `packages/tailwindcss-material-symbols/package.json`, run `pnpm changelog --tag vX.Y.Z`, commit both, and push the commit and the tag `vX.Y.Z`. The tag also publishes.
