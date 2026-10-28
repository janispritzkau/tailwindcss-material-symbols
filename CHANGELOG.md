# Changelog

All notable changes to `@janispritzkau/tailwindcss-material-symbols` are documented in this file.
The changelog is generated from the commit history with [git-cliff](https://git-cliff.org).

## [0.0.10](https://github.com/janispritzkau/tailwindcss-material-symbols/compare/v0.0.9...v0.0.10) - 2026-10-28

### Bug fixes

- Support pnpm 11+ install ([282fd00](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/282fd0032dbcf44ecd8814f4b41bcbd5b8f88863))
- Support codepoints above U+FFFF in update script ([6e48c56](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/6e48c56ec7365ee094db5791640b44970e1b89c7))
- Allow vite 8 as peer dependency ([cd12eb1](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/cd12eb17e8d6baaf690177250eb13c1a1d17cef4))
- **vite:** Don't hang on unused include, reset state between builds ([92a707e](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/92a707e2da14cc2e6b84b043765bce00b5692a61))
- Support arbitrary icon sizes in tailwind v3 ([433d303](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/433d303ab35be6dd41ae20e743b834bc4aeb75f4))
- **cli:** Print help once, error on unknown commands ([166ffba](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/166ffba973c4964bca92acc14fdb4d52e54d91f0))
- **subset:** Detect changed v3 defaults and custom v4 theme keys ([facbd4d](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/facbd4d0037dda84873f1cc6a41a72211375b028))
- Invalid ::before::before selector with v3 pseudo variants ([0b6db16](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/0b6db16b5a4ed06051e122860fc0a03ef4d08a10))

### Documentation

- Rewrite readme and contributing guide ([97ac2ac](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/97ac2acfd03bf0274999e62a2257178bb9abba19))

### Miscellaneous

- Update material symbols to 10ecc14 ([75adc69](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/75adc6936c390349fe81e12386847c08e468181f))
- Ship license files in the npm package ([f2721cc](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/f2721cc1288782bf3e43b9e19cbf3674297c87ba))
- Generate changelog and release notes with git-cliff ([2fda6fd](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/2fda6fdfe060d39fc515a176b4ee70389ac6fa31))

## [0.0.9](https://github.com/janispritzkau/tailwindcss-material-symbols/compare/v0.0.8...v0.0.9) - 2025-10-26

### Bug fixes

- Add missing default opsz (v4) ([7f7da43](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/7f7da43385153ed9c664a78efe2ac602572b653c))

## [0.0.8](https://github.com/janispritzkau/tailwindcss-material-symbols/compare/v0.0.7...v0.0.8) - 2025-10-08

### Features

- Add cli for subsetting ([74e4b05](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/74e4b05da8a3b0807e67fd7bc6a063e6f5afd2aa))

### Bug fixes

- Subsetting not working for tailwind v3 ([a95095c](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/a95095cff5cb2e26d4cf1e4e2ebb00ecb2a78398))
- Download script ([98ce654](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/98ce654f6ecf0b11f0f9cae1e0edb44922a50c3c))

### Refactoring

- Download and update scripts ([d109c95](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/d109c950dc7f97194bd078e3ebd3aa1141edcc0d))

### Miscellaneous

- Add -webkit-font-smoothing: antialiased to v3 plugin as well ([afe860e](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/afe860e57bf42603b21000a73a403de2ef39b6df))

## [0.0.7](https://github.com/janispritzkau/tailwindcss-material-symbols/compare/v0.0.5...v0.0.7) - 2025-10-08

### Features

- Individual font exports ([e767db7](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/e767db7231a6d97869af4e70acb60680103f76dc))

### Bug fixes

- Font paths in subset module ([f8e4e30](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/f8e4e30dcb4be3c8c4b3b1c7f8121b9d65c5bad9))

### Documentation

- Improve readme ([83f35c4](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/83f35c4fe0e6f6ab2651a7d2a8f209163b4855f1))

### Miscellaneous

- Add license field to package.json ([07a5053](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/07a5053f7bcbef9a06ea5b9f69656f9e4aa96288))
- Remove console.log ([cb22045](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/cb22045f74424bd3b6a9d76cbb49c2b88c0fabb1))
- Add keywords, author and bugs link to package ([0afc666](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/0afc66636cc8f6b5fcd278a9cb2b9f2d53b19353))

## [0.0.5](https://github.com/janispritzkau/tailwindcss-material-symbols/compare/v0.0.4...v0.0.5) - 2025-10-07

### Bug fixes

- Invalid regex for older node versions ([9c94402](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/9c94402b02f60913d981f1dd21dc1ef387f1700a))

### Miscellaneous

- Remove NODE_AUTH_TOKEN in favor of OIDC ([a0a7f1a](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/a0a7f1acd26c52952a7b5cc5c6a6ab8c4398ef55))
- Try different things for publishing ([e0d06fa](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/e0d06fa4d925e537542ec01c5d2ccb48ba821cbe))
- Update npm to latest before publish ([6487b69](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/6487b694f2bd389cb3608b349af04a2dac90b51e))
- Try update via npm command instead of pnpm ([e91b609](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/e91b609bdd6133cf2fc2d830cbade57dcdfcdcb4))

## [0.0.4](https://github.com/janispritzkau/tailwindcss-material-symbols/compare/v0.0.3...v0.0.4) - 2025-10-07

### Features

- Improved icon scale utilities ([b122376](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/b1223764e6d23e1d145e3ad21efb9bc9c1075e1a))

### Miscellaneous

- Try fix for npm provenance ([eb1b657](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/eb1b65716316e43d9ab53ecd68913ea662f76951))
- Add --no-git-checks on publish script ([e330b9b](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/e330b9b491894759e154bc4019b0e0e29178e8dd))

## [0.0.3](https://github.com/janispritzkau/tailwindcss-material-symbols/releases/tag/v0.0.3) - 2025-10-07

### Miscellaneous

- Update pnpm and node versions in publish workflow ([86774e1](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/86774e1689b2e2183cab4bdc7f6a40e4499803a0))
- Fix publish script ([1afc3c0](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/1afc3c09163c323e418fd5951b369598334adad5))
- Add provenance flag for publish ([c248257](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/c248257aaf69b7b9e1b05ad0e91264037f603a9b))
- Add missing files to package ([5b86015](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/5b86015af37bd90710184998c056b087ef91ec45))
- Add permissions for publish with provenance ([0abdd22](https://github.com/janispritzkau/tailwindcss-material-symbols/commit/0abdd22b0ed742f12f09037430bfb76898c9f7df))

<!-- generated by git-cliff -->
