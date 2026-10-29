import { PRESETS, type TonePreset, type ToneId } from './presets'
import { BANNED_FILLER } from './rules'

export type PrimaryAction = 'trial' | 'demo' | 'waitlist' | 'buy' | 'download'
export type Traffic = 'ads' | 'search' | 'social' | 'email'

export interface Intake {
  productName: string
  oneLiner: string
  category: string
  audience: string
  pain: string
  outcome: string
  timeToValue: string
  action: PrimaryAction
  riskReversal: string
  traffic: Traffic
}

export const SAMPLE_INTAKE: Intake = {
  productName: 'Ledgerline',
  oneLiner: 'Bookkeeping that categorises every receipt for you, so freelancers file taxes without the shoebox.',
  category: 'bookkeeping app',
  audience: 'freelance designers',
  pain: 'chasing receipts every month',
  outcome: 'tax ready books',
  timeToValue: '10 minutes a week',
  action: 'trial',
  riskReversal: '14 day free trial, no credit card',
  traffic: 'search',
}

export interface PageSpec {
  tone: TonePreset
  seed: number
  layout: { type: 'A' | 'C'; name: string; why: string }
  seo: { index: boolean; title: string; meta: string; note: string }
  nav: { brand: string; links: string[]; cta: string }
  hero: { headlineLines: string[]; sub: string; cta: string; proof: string; visualAlt: string }
  logos: string[]
  tagline: string[]
  problem: { heading: string; before: string; after: string }
  benefits: { title: string; detail: string }[]
  steps: { title: string; detail: string }[]
  testimonials: { quote: string; name: string; role: string; company: string }[]
  stats: { value: string; label: string }[]
  faq: { q: string; a: string }[]
  risk: string[]
  finalCta: { heading: string; cta: string; sub: string }
  assumptions: string[]
  sections: string[]
}

// ---------- tiny deterministic helpers ----------

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(r: () => number, arr: readonly T[], n: number): T[] {
  const pool = [...arr]
  const out: T[] = []
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0])
  return out
}

/** B1: no hyphens in text; A8/B8: no banned filler. */
export function cleanCopy(s: string): string {
  let out = s
    .replace(/\s+[-–—]\s+/g, ', ')
    .replace(/(\w)-(\w)/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim()
  for (const word of BANNED_FILLER) {
    out = out.replace(new RegExp(word, 'gi'), 'cut down')
  }
  return out
}

const sentence = (s: string) => {
  const c = cleanCopy(s)
  return c.charAt(0).toUpperCase() + c.slice(1)
}
const lower = (s: string) => cleanCopy(s).replace(/^[A-Z](?![A-Z])/, (m) => m.toLowerCase())
const stripDot = (s: string) => s.replace(/[.!]+$/, '')

/** Turn "chasing receipts every month" into "chasing receipts" style noun phrase for reuse. */
function painCore(pain: string) {
  return lower(pain).replace(/\s+(every|each|all)\s+\w+$/i, '')
}

const CTA_BY_ACTION: Record<PrimaryAction, string> = {
  trial: 'Start free trial',
  demo: 'Book a demo',
  waitlist: 'Join the waitlist',
  buy: 'Get {product}',
  download: 'Download the app',
}

const NAMES = [
  'Priya Raman',
  'Tomás Okafor',
  'Lena Fischer',
  'Daniel Mwangi',
  'Hana Sato',
  'Marcus Lindqvist',
  'Aisha Bello',
  'Rafael Duarte',
  'Mei Chen',
  'Owen Gallagher',
]
const COMPANIES = [
  'Northwind Studio',
  'Fieldnote',
  'Kestrel & Co',
  'Halftone Labs',
  'Bramble Works',
  'Lumen Atelier',
  'Copperleaf',
  'Saltbox Design',
  'Tidewater',
  'Pinecrest Supply',
]

// ---------- generator ----------

export function generate(intake: Intake, toneId: ToneId, seed = 0): PageSpec {
  const tone = PRESETS[toneId]
  const r = rng(hash(intake.productName + intake.audience) + seed * 7919)
  const assumptions: string[] = []

  const product = cleanCopy(intake.productName) || 'Your product'
  if (!intake.productName.trim()) assumptions.push('No product name given, used "Your product".')
  const audience = lower(intake.audience || 'small teams')
  if (!intake.audience.trim()) assumptions.push('No audience given, assumed small teams.')
  const pain = lower(intake.pain || 'manual busywork')
  const outcome = lower(intake.outcome || 'hours back every week')
  const time = lower(intake.timeToValue || 'one afternoon')
  const category = lower(intake.category || 'tool')
  const risk = cleanCopy(intake.riskReversal || '30 day money back guarantee')
  if (!intake.riskReversal.trim()) assumptions.push('No risk reversal given, defaulted to a 30 day money back guarantee (A4 requires one).')

  const cta = CTA_BY_ACTION[intake.action].replace('{product}', product)

  // A3 layout choice
  const minimal = intake.action === 'waitlist' || intake.action === 'download' || intake.traffic === 'email'
  const layout = minimal
    ? {
        type: 'C' as const,
        name: 'Minimal conversion page',
        why:
          intake.traffic === 'email'
            ? 'Traffic is email to people who already know you, so intent is high and the page can stay short.'
            : `A ${intake.action} is a short offer, so the page only needs the hero, proof and objections.`,
      }
    : {
        type: 'A' as const,
        name: 'Classic hero plus sections',
        why: `${product} is understandable from a product screenshot, so a hero plus argument sections fits.`,
      }

  // A5 headline formula per tone
  let headlineLines: string[]
  switch (tone.headlineFormula) {
    case 'outcome-without-pain':
      headlineLines = [sentence(outcome), `without ${painCore(pain)}`]
      break
    case 'category-for-audience':
      headlineLines = [`The ${category}`, `for ${audience}`]
      break
    case 'ship-result-in-time':
      headlineLines = [`Get ${outcome}`, `in ${time}`]
      break
  }

  const sub = (() => {
    const one = stripDot(sentence(intake.oneLiner || `${product} helps ${audience} get ${outcome}`))
    if (tone.voice === 'warm') return `${one}. Made for ${audience}, about ${time} of your time.`
    if (tone.voice === 'direct') return `${one}. Built for ${audience} who are done with ${painCore(pain)}.`
    return `${one}.`
  })()

  const users = 1200 + Math.floor(r() * 3800)
  const usersStr = users.toLocaleString('en-US')
  const rating = (4.6 + r() * 0.3).toFixed(1)
  const hoursBefore = 3 + Math.floor(r() * 4)
  const minutesAfter = 12 + Math.floor(r() * 25)
  const pct = 31 + Math.floor(r() * 40)

  const proof =
    intake.traffic === 'ads'
      ? `Rated ${rating} by ${usersStr} ${audience}`
      : `Trusted by ${usersStr} ${audience}`

  const logos = pick(r, COMPANIES, 5)
  const people = pick(r, NAMES, 3)
  const peopleCos = pick(r, COMPANIES, 3)

  const tagline =
    tone.voice === 'warm'
      ? [`Less ${painCore(pain)}.`, `More of the work you love.`]
      : tone.voice === 'direct'
        ? [`Stop ${painCore(pain)}.`, `Start every week with ${outcome}.`]
        : [`You do the work you are paid for.`, `${product} takes care of ${painCore(pain)}.`]

  const problem = {
    heading: tone.voice === 'warm' ? `You should not have to keep ${painCore(pain)}` : `${sentence(painCore(pain))} costs more than it looks`,
    before: `Today ${audience} lose about ${hoursBefore} hours a week to ${painCore(pain)}, and it always lands at the worst time.`,
    after: `With ${product}, the same job takes ${minutesAfter} minutes and you end up with ${outcome}.`,
  }

  const benefits = [
    {
      title: `${hoursBefore} hours back each week`,
      detail: `Cut ${painCore(pain)} from ${hoursBefore} hours to ${minutesAfter} minutes, measured across ${usersStr} accounts.`,
    },
    {
      title: `${sentence(outcome)} by default`,
      detail: `${product} does the sorting as things happen, so ${outcome} are waiting whenever you need them.`,
    },
    {
      title: `Done in ${time}`,
      detail: `Connect the tools you already use. No migration project, no consultant.`,
    },
    {
      title: `${pct}% fewer surprises`,
      detail: `Customers report ${pct}% fewer last minute fixes in their first quarter.`,
    },
  ].map((b) => ({ title: sentence(b.title), detail: sentence(b.detail) }))

  const steps = [
    { title: `Create your account`, detail: `${risk}. It takes under two minutes.` },
    { title: `Connect your tools`, detail: `Link the accounts you already use and ${product} reads what it needs.` },
    { title: `Get ${outcome}`, detail: `Review in ${time}, then share or export when you are ready.` },
  ].map((s) => ({ title: sentence(s.title), detail: sentence(s.detail) }))

  const quotes = [
    `I used to spend Sunday nights ${painCore(pain)}. Now it is ${minutesAfter} minutes on Friday and I am done.`,
    `${product} paid for itself in the first month. The ${outcome} were ready before I asked.`,
    `It takes me ${time} now. I have not opened a spreadsheet for this since.`,
  ]
  const role = audience.replace(/s$/, '').replace(/^(\w)/, (m) => m.toUpperCase())
  const testimonials = quotes.map((q, i) => ({
    quote: sentence(q),
    name: people[i],
    role,
    company: peopleCos[i],
  }))

  const stats = [
    { value: usersStr, label: sentence(`${audience} on ${product}`) },
    { value: `${minutesAfter} min`, label: 'Median weekly time' },
    { value: rating, label: 'Average rating' },
  ]

  const faq = [
    { q: `What does ${product} cost?`, a: `Plans start at $${11 + Math.floor(r() * 18)} a month. ${risk}.` },
    { q: 'Can I cancel anytime?', a: 'Yes. Cancel from settings in two clicks and keep access until the end of the period.' },
    { q: 'Is my data safe?', a: 'Data is encrypted in transit and at rest, and you can export or delete everything at any time.' },
    { q: 'How much of my time does it take?', a: `Most ${audience} spend about ${time}. Setup itself is under two minutes.` },
    { q: `Who is ${product} for?`, a: `${sentence(audience)} who want ${outcome} without ${painCore(pain)}.` },
    { q: 'Can I switch from my current tool?', a: `Yes. Import a CSV or connect your old account and ${product} maps it for you.` },
    { q: 'Do you offer help if I get stuck?', a: 'Every plan includes email support with replies within one business day.' },
  ].map((f) => ({ q: sentence(f.q), a: sentence(f.a) }))

  const riskList = [risk, 'Cancel anytime', 'Export your data whenever you want'].map(sentence)

  const seo =
    intake.traffic === 'ads'
      ? { index: false, title: `${product} | ${sentence(outcome)}`, meta: '', note: 'Ad only campaign page, so noindex (A7).' }
      : {
          index: true,
          title: `${product}: ${sentence(category)} for ${audience}`,
          meta: sentence(`${stripDot(intake.oneLiner || outcome)}. ${risk}.`),
          note: 'Evergreen offer that matches search intent, so index it with FAQ schema (A7).',
        }

  const sections =
    layout.type === 'C'
      ? ['Hero', 'Proof strip', 'Tagline reveal', 'Benefits', 'FAQ', 'Risk reversal', 'Final CTA']
      : [
          'Hero',
          'Proof strip',
          'Tagline reveal',
          'Problem to solution',
          'Benefits',
          'How it works',
          'Social proof',
          'FAQ',
          'Risk reversal',
          'Final CTA',
        ]

  return {
    tone,
    seed,
    layout,
    seo,
    nav: { brand: product, links: ['Product', 'Customers', 'Pricing', 'FAQ'], cta },
    hero: {
      headlineLines: headlineLines.map((l, i) => (i === 0 ? sentence(l) : cleanCopy(l))),
      sub: cleanCopy(sub),
      cta,
      proof,
      visualAlt: `${product} dashboard showing ${outcome}`,
    },
    logos,
    tagline: tagline.map(cleanCopy),
    problem: { heading: sentence(problem.heading), before: sentence(problem.before), after: sentence(problem.after) },
    benefits,
    steps,
    testimonials,
    stats,
    faq: layout.type === 'C' ? faq.slice(0, 6) : faq,
    risk: riskList,
    finalCta: {
      heading: sentence(tone.voice === 'warm' ? `Ready for ${outcome}?` : `${headlineLines.join(' ')}`),
      cta,
      sub: risk,
    },
    assumptions,
    sections,
  }
}

export function outlineMarkdown(spec: PageSpec): string {
  const lines: string[] = []
  lines.push(`# ${spec.nav.brand} landing page (${spec.tone.label})`, '')
  lines.push('## 1. Page outline', ...spec.sections.map((s, i) => `${i + 1}. ${s}`), '')
  lines.push(
    '## 2. Hero copy',
    `- Headline: ${spec.hero.headlineLines.join(' / ')}`,
    `- Subheadline: ${spec.hero.sub}`,
    `- CTA: ${spec.hero.cta}`,
    `- Proof: ${spec.hero.proof}`,
    '',
  )
  lines.push('## 3. Benefits', ...spec.benefits.map((b) => `- **${b.title}** — ${b.detail}`), '')
  lines.push('## 4. How it works', ...spec.steps.map((s, i) => `${i + 1}. **${s.title}** ${s.detail}`), '')
  lines.push('## 5. FAQ', ...spec.faq.flatMap((f) => [`**${f.q}**`, f.a, '']))
  lines.push(
    '## 6. SEO / AEO',
    `- ${spec.seo.index ? 'index' : 'noindex'}: ${spec.seo.note}`,
    ...(spec.seo.index ? [`- Title: ${spec.seo.title}`, `- Meta: ${spec.seo.meta}`] : []),
    '',
  )
  lines.push('## 7. Layout recommendation', `- ${spec.layout.type}. ${spec.layout.name}: ${spec.layout.why}`, '')
  if (spec.assumptions.length) lines.push('## Assumptions', ...spec.assumptions.map((a) => `- ${a}`), '')
  return lines.join('\n')
}
