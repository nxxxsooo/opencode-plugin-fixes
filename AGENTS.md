# opencode-plugin-fixes

## Overview

Publishable OpenCode plugin package that bundles small runtime guard plugins for tool argument coercion and repeated question blocking.

## Layout

- `src/index.js` — package entry; exports all OpenCode plugin functions.
- `test/driver.mjs` — executable end-to-end driver for plugin hooks.
- `README.md` — npm/GitHub user docs.

## Patterns & Conventions

- Keep runtime dependency-free unless a plugin genuinely needs external packages.
- Export named async plugin functions; OpenCode loads plugin functions from the package module.
- Preserve narrow matching: only mutate known question tools or known MCP tool prefixes.
- Do not include third-party/proprietary local plugins here. `vibe-island.js` stays in its own integration/repo.

## Verification

Run `npm test` before publishing. Run `npm pack --dry-run` to verify package contents.
