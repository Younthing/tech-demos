# tech-demos

Sticky monorepo of small single-user tech demos. One demo per app. Do not open a new repository for a demo.

## Layout

- `apps/<kebab-slug>/` — one self-contained demo (empty until a demo lands)
- `skills/project-planning/SKILL.md` — planning steps to follow before coding a demo
- `tracking/seen-bookmarks.json` — bookmark log with `proposed`, `approved`, and `skipped`; each entry is `{id, title, url, date}`
- `AGENTS.md` — rules for every agent working in this repo

## Run an app

From that app’s folder:

```bash
bun install && bun run dev
```

Each app uses Bun and ships its own `bunfig.toml` (`minimumReleaseAge = 259200` under `[install]`) before install. UI defaults to shadcn/ui, minimalist.
