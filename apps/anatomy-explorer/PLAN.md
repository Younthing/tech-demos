# Anatomy Explorer

## Goal

A single-user page that shows three prebuilt Anatomy figures — an LLM pipeline, a CI pipeline, and a token-bucket rate limiter — as inspectable isometric machines you can turn and click.

## MVP

Ships:

- Three bundled machines drawn with the vendored Anatomy kit (`iso-kit`): solid parts, four-tone shading, a framed plate, one lit accent, one engraved label.
- Drag (and turn buttons / arrow keys) orbits the kit camera. Click a part, or its row in the list, and the plate readout plus a side panel show that part’s name and what it does in the pipeline.
- Light Anatomy theme inside a shadcn/ui shell. No Claude Code, no model API, no key.

Out of scope:

- Generating a new figure from a sentence at runtime.
- WebGL plumes, the 3D turn runtime, exploded views, print PDFs, and the geometry audit.
- Accounts, saving, or editing part copy.

## Tasks

1. Scaffold a Vite React app and initialize shadcn/ui with the Sera preset (the minimal, editorial one) before any feature UI.
2. Vendor `iso-kit` (MIT) and draw the three machines as assemblies of kit solids. Each assembly is one clickable part.
3. Orbit by rebuilding the kit projection (azimuth and a limited elevation) and depth-sorting assemblies. Select a part from the drawing or the list.
4. Verify rotate and click in the browser, including an empty selection and a narrow viewport.

## Stack

- **Vite + React + TypeScript** (`bunx create-vite`, template `react-ts`). One screen; Next.js would only add a server we do not need.
- **Bun** for install, `bun run dev`, and `bun test`. `bunfig.toml` sets `minimumReleaseAge = 259200` before the first install.
- **shadcn/ui, Sera preset, Radix base.** Sera is the minimalist preset (print-like type, quiet controls). Components added only as used: button, card, badge, separator, scroll-area.
- **Anatomy `kit/iso-kit.ts` + `iso.css`**, copied in with the MIT notice. The kit is the renderer: camera, solids, shading, plate. Figures are source we own, which is how Anatomy ships output.

## Deferred

- A prompt box that calls an agent. That needs Claude Code or a paid API, which this demo must not require.
- Pipes via `tube.mjs` / turned parts via `lathe.mjs`. Prisms and cylinders are enough for these three benches, and they keep the vendor to the core kit.
- Per-facet painter’s order while orbiting. Assemblies sort by depth; the plate paints first. Close-ups can still show a lip crossing a foot. Acceptable for an orbit demo, not for a published Anatomy figure.
