# AI Landing Designer

A one-screen demo of the [`landing-page-design`](https://github.com/elayadesign/ai-design-skills/tree/main/skills/landing-page-design) skill from elayadesign/ai-design-skills (MIT).

Fill in a short intake (product, audience, pain, outcome, primary action, risk reversal, traffic source). A deterministic template engine applies the skill's rules and renders:

- **Preview**: a full landing page in the skill's section order (hero, proof strip, tagline reveal, problem to solution, benefits, how it works, testimonials, FAQ, risk reversal, final CTA). It uses Tailwind type steps, the 13 spacing tokens, the nested radius formula, flat backgrounds, the hero text gradient, the base motion curve, and a word by word tagline reveal on IntersectionObserver.
- **Tokens**: the type scale, spacing, radius (outer − gap = inner), motion curve and palette used by the current tone.
- **Checklist**: the skill's quick checklist evaluated against the generated page.
- **Outline**: the skill's "Output format" (sections 1 to 7) as Markdown you can copy.

There are three tone presets: **Minimal editorial** (Geist, light), **Dark product** (Manrope, B4 dark surfaces) and **Warm friendly** (Poppins, cream). Each one uses a different headline formula from §A5. **Regenerate** reshuffles names, logos and numbers.

No LLM, API key or network access is needed at runtime.

## Run

```bash
bun install
bun run dev      # http://localhost:5173
bun test         # engine tests
bun run build
```

## Layout

```
src/engine/      rules.ts (skill Part B values) · presets.ts · generate.ts · checklist.ts · tests
src/features/    intake/ · preview/ (LandingPreview, Reveal, TaglineReveal) · tokens/
src/components/ui shadcn/ui (radix-nova, neutral)
media/           screenshots + demo video for the PR
```

The app chrome uses shadcn/ui (with Lucide icons). The generated page uses Phosphor icons only, as the skill's §B6 requires.
