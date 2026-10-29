import type { TypeStep } from './rules'

export type ToneId = 'editorial' | 'dark' | 'warm'

export interface TonePreset {
  id: ToneId
  label: string
  blurb: string
  font: { name: 'Geist' | 'Manrope' | 'Poppins'; css: string }
  theme: 'light' | 'dark'
  colors: {
    bg: string
    surface: string
    surfaceAlt: string
    text: string
    muted: string
    border: string
    accent: string
    accentText: string
    heroFrom: string
    heroTo: string
  }
  radius: { outerPx: number; gapPx: number }
  type: {
    hero: TypeStep
    sub: TypeStep
    h2: TypeStep
    body: TypeStep
    small: TypeStep
    tagline: TypeStep
  }
  /** spacing values used by the preview, all from B2 */
  spacing: { sectionY: number; stackGap: number; cardPad: number; buttonY: number; buttonX: number }
  motion: { layoutMs: number; hoverMs: number; revealMs: number; riseOffsetPx: number; wordStaggerMs: number }
  headlineFormula: 'outcome-without-pain' | 'category-for-audience' | 'ship-result-in-time'
  voice: 'editorial' | 'direct' | 'warm'
}

export const PRESETS: Record<ToneId, TonePreset> = {
  editorial: {
    id: 'editorial',
    label: 'Minimal editorial',
    blurb: 'Geist, light, quiet. Outcome without pain headline.',
    font: { name: 'Geist', css: "'Geist Variable', sans-serif" },
    theme: 'light',
    colors: {
      bg: '#FFFFFF',
      surface: '#F7F7F7',
      surfaceAlt: '#EFEFEF',
      text: '#0A0A0A',
      muted: '#5C5C5C',
      border: '#E4E4E4',
      accent: '#0A0A0A',
      accentText: '#FFFFFF',
      heroFrom: '#000000',
      heroTo: '#666666',
    },
    radius: { outerPx: 12, gapPx: 4 },
    type: { hero: 'text-6xl', sub: 'text-lg', h2: 'text-3xl', body: 'text-base', small: 'text-sm', tagline: 'text-5xl' },
    spacing: { sectionY: 96, stackGap: 24, cardPad: 24, buttonY: 8, buttonX: 12 },
    motion: { layoutMs: 500, hoverMs: 300, revealMs: 700, riseOffsetPx: 32, wordStaggerMs: 60 },
    headlineFormula: 'outcome-without-pain',
    voice: 'editorial',
  },
  dark: {
    id: 'dark',
    label: 'Dark product',
    blurb: 'Manrope, dark surfaces from B4, category for audience headline.',
    font: { name: 'Manrope', css: "'Manrope Variable', sans-serif" },
    theme: 'dark',
    colors: {
      bg: '#000000',
      surface: '#181818',
      surfaceAlt: '#1F1F1F',
      text: '#FFFFFF',
      muted: '#A3A3A3',
      border: '#313131',
      accent: '#FFFFFF',
      accentText: '#000000',
      heroFrom: '#FFFFFF',
      heroTo: '#9B9B9B',
    },
    radius: { outerPx: 16, gapPx: 8 },
    type: { hero: 'text-6xl', sub: 'text-lg', h2: 'text-4xl', body: 'text-base', small: 'text-sm', tagline: 'text-6xl' },
    spacing: { sectionY: 80, stackGap: 32, cardPad: 32, buttonY: 8, buttonX: 12 },
    motion: { layoutMs: 500, hoverMs: 300, revealMs: 800, riseOffsetPx: 32, wordStaggerMs: 60 },
    headlineFormula: 'category-for-audience',
    voice: 'direct',
  },
  warm: {
    id: 'warm',
    label: 'Warm friendly',
    blurb: 'Poppins, soft cream, rounder shapes. Ship result in time headline.',
    font: { name: 'Poppins', css: "'Poppins', sans-serif" },
    theme: 'light',
    colors: {
      bg: '#FFFBF5',
      surface: '#FFF3E3',
      surfaceAlt: '#FCE8CF',
      text: '#2B1D0E',
      muted: '#7A6450',
      border: '#F1DCC1',
      accent: '#C2410C',
      accentText: '#FFFFFF',
      heroFrom: '#000000',
      heroTo: '#666666',
    },
    radius: { outerPx: 24, gapPx: 12 },
    type: { hero: 'text-5xl', sub: 'text-xl', h2: 'text-3xl', body: 'text-base', small: 'text-sm', tagline: 'text-5xl' },
    spacing: { sectionY: 96, stackGap: 24, cardPad: 24, buttonY: 8, buttonX: 12 },
    motion: { layoutMs: 500, hoverMs: 300, revealMs: 600, riseOffsetPx: 32, wordStaggerMs: 60 },
    headlineFormula: 'ship-result-in-time',
    voice: 'warm',
  },
}

export const PRESET_LIST = Object.values(PRESETS)
