# Agent rules

This is a sticky monorepo of small single-user tech demos. Each demo is one app under `apps/<kebab-slug>/`.

## Where work goes

- Never create a new repo. Add the demo in this monorepo.
- A demo agent only adds or updates its own `apps/<slug>/`.
- Update `tracking/seen-bookmarks.json` only when told. Entries are `{id, title, url, date}` inside `proposed`, `approved`, or `skipped`.
- One pull request per demo.

## Before coding

Follow `skills/project-planning/SKILL.md`, then write `apps/<slug>/PLAN.md` before application code.

## Each app

- Self-contained. It runs with `bun install && bun run dev` from its own folder.
- Uses Bun.
- Has its own `bunfig.toml` before any install:

```toml
[install]
minimumReleaseAge = 259200
```

- UI defaults to shadcn/ui, minimalist preset.

## Pull requests

Every demo pull request must attach at least one screenshot and at least one video of the running app.
