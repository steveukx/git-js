# @simple-git/docs-site

Static documentation site for `simple-git` built with Astro + Starlight.

## Commands

- `yarn workspace @simple-git/docs-site dev` runs markdown sync + API generation watchers and starts the local docs server.
- `yarn workspace @simple-git/docs-site build` runs generation steps and builds static output.
- `yarn workspace @simple-git/docs-site preview` serves the built output.
- `yarn workspace @simple-git/docs-site check` runs Astro checks.

## Content Sources

- `simple-git/readme.md`
- `docs/*.md`
- `simple-git/typings/index.d.ts` with type/source resolution via `simple-git/tsconfig.release.json`

Generated files are written to:

- `src/content/docs/generated`
- `src/content/docs/api`

These paths are generated at runtime and are intentionally gitignored.

## Vercel Deployment

Configure the Vercel project in the dashboard with:

- **Framework preset:** Astro
- **Install command:** `yarn install --immutable`
- **Build command:** `yarn workspace @simple-git/docs-site build`
- **Output directory:** `packages/docs-site/dist`
- **Root directory:** repository root

No `vercel.json` is required for this phase.
