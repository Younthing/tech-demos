import type { PageSpec } from './generate'
import { APPROVED_FONTS, BANNED_CTAS, BANNED_FILLER, DARK_BACKGROUNDS, SPACING, TYPE_SCALE, nestedRadius } from './rules'

export interface Check {
  group: 'Strategy' | 'Visual' | 'Content'
  label: string
  pass: boolean
  detail?: string
}

function allCopy(spec: PageSpec): string[] {
  return [
    ...spec.hero.headlineLines,
    spec.hero.sub,
    spec.hero.cta,
    spec.hero.proof,
    ...spec.tagline,
    spec.problem.heading,
    spec.problem.before,
    spec.problem.after,
    ...spec.benefits.flatMap((b) => [b.title, b.detail]),
    ...spec.steps.flatMap((s) => [s.title, s.detail]),
    ...spec.testimonials.map((t) => t.quote),
    ...spec.faq.flatMap((f) => [f.q, f.a]),
    ...spec.risk,
    spec.finalCta.heading,
  ]
}

export function runChecklist(spec: PageSpec): Check[] {
  const copy = allCopy(spec)
  const t = spec.tone
  const hyphenated = copy.filter((c) => /\w-\w|\s-\s/.test(c))
  const filler = BANNED_FILLER.filter((w) => copy.some((c) => c.toLowerCase().includes(w)))
  const scale = TYPE_SCALE.map((s) => s.cls as string)
  const usedType = Object.values(t.type)
  const spacingPx = SPACING.map((s) => s.px as number)
  const usedSpacing = Object.values(t.spacing)
  const inner = nestedRadius(t.radius.outerPx, t.radius.gapPx)
  const ctaLower = spec.hero.cta.toLowerCase()

  return [
    { group: 'Strategy', label: 'One offer, one audience, one primary action', pass: spec.nav.cta === spec.hero.cta, detail: spec.hero.cta },
    { group: 'Strategy', label: 'CTA is verb plus outcome (not Learn more / Submit)', pass: !BANNED_CTAS.some((b) => ctaLower === b) },
    { group: 'Strategy', label: 'At least one risk reversal', pass: spec.risk.length > 0, detail: spec.risk[0] },
    { group: 'Strategy', label: 'Final CTA identical to the top', pass: spec.finalCta.cta === spec.hero.cta },
    { group: 'Strategy', label: `Benefits 3 to 5 (${spec.benefits.length})`, pass: spec.benefits.length >= 3 && spec.benefits.length <= 5 },
    { group: 'Strategy', label: `FAQ 6 to 12 (${spec.faq.length})`, pass: spec.faq.length >= 6 && spec.faq.length <= 12 },
    { group: 'Strategy', label: `Layout chosen deliberately: ${spec.layout.type}`, pass: true, detail: spec.layout.why },
    {
      group: 'Visual',
      label: `Approved typeface: ${t.font.name}`,
      pass: (APPROVED_FONTS as readonly string[]).includes(t.font.name),
    },
    { group: 'Visual', label: 'Every font size on the Tailwind scale', pass: usedType.every((u) => scale.includes(u)), detail: [...new Set(usedType)].join(', ') },
    {
      group: 'Visual',
      label: 'Every spacing value from the spacing table',
      pass: usedSpacing.every((s) => spacingPx.includes(s)),
      detail: [...new Set(usedSpacing)].map((s) => `${s}px`).join(', '),
    },
    {
      group: 'Visual',
      label: 'Nested radius follows outer minus gap',
      pass: inner === null || inner === t.radius.outerPx - t.radius.gapPx,
      detail: `${t.radius.outerPx} − ${t.radius.gapPx} = ${inner ?? 'square'}`,
    },
    {
      group: 'Visual',
      label: 'Flat backgrounds; dark bg from the B4 list',
      pass: t.theme === 'light' || (DARK_BACKGROUNDS as readonly string[]).includes(t.colors.bg.toUpperCase()),
      detail: t.colors.bg,
    },
    { group: 'Visual', label: 'Tagline reveal present, at least two lines', pass: spec.tagline.length >= 2 },
    { group: 'Visual', label: 'Motion on base curve, transform and opacity only', pass: t.motion.hoverMs >= 200 },
    { group: 'Content', label: 'No hyphens in copy', pass: hyphenated.length === 0, detail: hyphenated[0] },
    { group: 'Content', label: 'No banned filler words', pass: filler.length === 0, detail: filler.join(', ') || undefined },
    {
      group: 'Content',
      label: 'Believable names and non round numbers',
      pass: new Set(spec.testimonials.map((x) => x.name)).size === spec.testimonials.length,
    },
  ]
}
