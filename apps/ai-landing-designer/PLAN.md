# PLAN — ai-landing-designer

Source: [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) · `skills/landing-page-design/SKILL.md` (MIT).
Bookmark: https://x.com/elayadesigns/status/2114049200749175174

## Goal (one sentence)

Turn a product one-liner plus a short intake into a previewable landing page that follows the `landing-page-design` skill's structure, copy and visual rules, with the resolved design tokens shown side by side.

## Single-user MVP

In:
1. Intake form (skill §A1, trimmed): product name, one-liner, audience (ICP), main pain, primary action/CTA, offer type (trial / demo / waitlist / buy / download), risk reversal, traffic source.
2. Deterministic generator (no LLM): fills the skill's §A2 section order (hero → proof → tagline reveal → problem/solution → benefits → how it works → testimonials → FAQ → risk reversal → final CTA) using §A5 headline formulas, CTA verb rules, §A3 layout pick (A/C) and §B8 realism (odd numbers, specific names, banned filler filtered, no hyphens in copy).
3. Live preview rendered inside an isolated frame-like panel using only the §B visual system (Tailwind type steps, the 13 spacing tokens, nested radius formula, flat backgrounds, hero text gradient, base curve motion, tagline reveal word by word with IntersectionObserver).
4. Design tokens panel next to the preview: type scale in use, spacing tokens in use, radius (outer/gap/inner via formula), motion curve and durations, palette, plus a §Quick checklist with pass/fail.
5. Three tone presets (Minimal editorial · Dark product · Warm friendly) that swap font (Geist / Manrope / Poppins), theme (light / dark from §B4 list), radius scale and copy voice; switching regenerates instantly.
6. Export: copy the generated outline (skill "Output format" 1–7) as Markdown.

Out (deferred): real LLM calls, accounts/persistence beyond localStorage, multi-page sites, HTML export/deploy, SEO server rendering, mobile menu animation (nav is single bar).

## Tasks (vertical slices)

1. Scaffold: `bun create vite` react-ts → bunfig.toml → Tailwind v4 + shadcn/ui init (neutral/minimal) → add `button input textarea label select tabs card badge separator switch`.
2. `src/engine/` — `rules.ts` (tokens from skill §B), `presets.ts` (3 tones), `generate.ts` (intake → `PageSpec`), `checklist.ts` (lint copy: hyphens, banned words, CTA verbs, token membership). Unit tests with `bun test` for generate + checklist (critical logic only).
3. `src/features/intake/` — form with defaults (a sample product), inline validation (§B9 error states).
4. `src/features/preview/` — `LandingPreview` rendering `PageSpec` with tone tokens via CSS variables; tagline reveal hook.
5. `src/features/tokens/` — tokens panel + checklist + outline export.
6. `App.tsx` — three column on wide screens (intake | preview | tokens), tone switcher in the header.
7. Media: Playwright screenshot + video of switching tones → `media/`.

## Stack

- **Vite + React + TS** — one-screen utility, no router/server needed; official scaffold.
- **Tailwind v4 + shadcn/ui (neutral, new-york)** — repo default; the skill itself speaks Tailwind classes.
- **@phosphor-icons/react** — skill §B6 allows Phosphor (no Lucide in the generated page).
- **@fontsource-variable/geist, manrope; @fontsource/poppins** — skill §B1 approved fonts, served locally.
- **bun test** — engine tests only.
- **Playwright (dev only, via bunx)** — screenshots and video for the PR.

## Deferred and why

- LLM copywriting: out of scope, keeps runtime free and deterministic.
- HTML/zip export: the preview is the deliverable for a demo.
- Git hooks: single-folder demo, `bun run build` is the check.
