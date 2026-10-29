// Visual system values copied from elayadesign/ai-design-skills
// skills/landing-page-design/SKILL.md (MIT), Part B.

export const TYPE_SCALE = [
  { cls: 'text-xs', px: 12, lh: '16px' },
  { cls: 'text-sm', px: 14, lh: '20px' },
  { cls: 'text-base', px: 16, lh: '24px' },
  { cls: 'text-lg', px: 18, lh: '28px' },
  { cls: 'text-xl', px: 20, lh: '28px' },
  { cls: 'text-2xl', px: 24, lh: '32px' },
  { cls: 'text-3xl', px: 30, lh: '36px' },
  { cls: 'text-4xl', px: 36, lh: '40px' },
  { cls: 'text-5xl', px: 48, lh: '1' },
  { cls: 'text-6xl', px: 60, lh: '1' },
  { cls: 'text-7xl', px: 72, lh: '1' },
  { cls: 'text-8xl', px: 96, lh: '1' },
  { cls: 'text-9xl', px: 128, lh: '1' },
] as const

export type TypeStep = (typeof TYPE_SCALE)[number]['cls']

export const SPACING = [
  { token: 'Spacing-0', px: 0 },
  { token: 'Spacing-25', px: 2 },
  { token: 'Spacing-50', px: 4 },
  { token: 'Spacing-75', px: 8 },
  { token: 'Spacing-100', px: 12 },
  { token: 'Spacing-200', px: 16 },
  { token: 'Spacing-300', px: 24 },
  { token: 'Spacing-400', px: 32 },
  { token: 'Spacing-500', px: 40 },
  { token: 'Spacing-600', px: 48 },
  { token: 'Spacing-700', px: 64 },
  { token: 'Spacing-800', px: 80 },
  { token: 'Spacing-900', px: 96 },
] as const

export const RADII = [
  { cls: 'rounded-none', px: 0 },
  { cls: 'rounded-xs', px: 2 },
  { cls: 'rounded-sm', px: 4 },
  { cls: 'rounded-md', px: 6 },
  { cls: 'rounded-lg', px: 8 },
  { cls: 'rounded-xl', px: 12 },
  { cls: 'rounded-2xl', px: 16 },
  { cls: 'rounded-3xl', px: 24 },
  { cls: 'rounded-4xl', px: 32 },
] as const

export const DARK_BACKGROUNDS = ['#000000', '#181818', '#1F1F1F', '#272727', '#313131', '#131209'] as const

export const APPROVED_FONTS = ['Geist', 'Manrope', 'Geist Mono', 'Poppins'] as const
export const BANNED_FONTS = ['Inter', 'Roboto', 'Arial', 'Open Sans', 'Helvetica'] as const

export const BASE_CURVE = 'cubic-bezier(0.22,1,0.36,1)'
export const BASE_CURVE_POINTS = [0.22, 1, 0.36, 1] as const

export const BANNED_FILLER = [
  'revolutionize',
  'supercharge',
  'cutting edge',
  'effortless',
  'transform your workflow',
  'take it to the next level',
  'harness the power',
  'world class',
  'streamline',
  'optimize',
] as const

export const BANNED_CTAS = ['learn more', 'submit', 'click here'] as const

/** B3 nested radius: inner = outer − gap, only when gap < 32 and result > 2. */
export function nestedRadius(outerPx: number, gapPx: number): number | null {
  if (gapPx >= 32) return null
  const inner = outerPx - gapPx
  return inner > 2 ? inner : null
}

export function radiusClass(px: number | null): string {
  if (px === null) return 'rounded-none'
  // snap to closest radius step at or below
  let best: (typeof RADII)[number] = RADII[0]
  for (const r of RADII) if (r.px <= px) best = r
  return best.cls
}

export function spacingToken(px: number) {
  return SPACING.find((s) => s.px === px)?.token ?? null
}
