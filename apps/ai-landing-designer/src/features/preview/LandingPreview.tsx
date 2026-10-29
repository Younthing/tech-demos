import { useRef, useState, type CSSProperties } from 'react'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  LightningIcon,
  PlugsConnectedIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StarIcon,
  UserPlusIcon,
  CaretDownIcon,
  ClockCountdownIcon,
} from '@phosphor-icons/react'
import type { PageSpec } from '@/engine/generate'
import { BASE_CURVE, nestedRadius, radiusClass } from '@/engine/rules'
import { Reveal, TaglineReveal } from './reveal'

// static class maps so Tailwind can see every class (all values come from B2 spacing)
const PY: Record<number, string> = { 80: 'py-20', 96: 'py-24' }
const GAP: Record<number, string> = { 24: 'gap-6', 32: 'gap-8' }
const PAD: Record<number, string> = { 24: 'p-6', 32: 'p-8' }
const INSET: Record<number, string> = { 4: 'p-1', 8: 'p-2', 12: 'p-3' }

const BENEFIT_ICONS = [ClockCountdownIcon, CheckCircleIcon, LightningIcon, ShieldCheckIcon]
const STEP_ICONS = [UserPlusIcon, PlugsConnectedIcon, SparkleIcon]

export function LandingPreview({ spec, mobile }: { spec: PageSpec; mobile: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)
  const t = spec.tone
  const c = t.colors
  const outer = radiusClass(t.radius.outerPx)
  const inner = radiusClass(nestedRadius(t.radius.outerPx, t.radius.gapPx))
  const inset = INSET[t.radius.gapPx]
  const section = `${PY[t.spacing.sectionY]} px-6`
  const stack = GAP[t.spacing.stackGap]
  const cardPad = PAD[t.spacing.cardPad]
  const isC = spec.layout.type === 'C'
  const [openFaq, setOpenFaq] = useState(0)

  const vars = {
    '--p-bg': c.bg,
    '--p-surface': c.surface,
    '--p-surface-alt': c.surfaceAlt,
    '--p-text': c.text,
    '--p-muted': c.muted,
    '--p-border': c.border,
    '--p-accent': c.accent,
    '--p-accent-text': c.accentText,
    fontFamily: t.font.css,
    background: c.bg,
    color: c.text,
  } as CSSProperties

  const ease = { transitionTimingFunction: BASE_CURVE, transitionDuration: `${t.motion.hoverMs}ms` }
  const heroGradient: CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${c.heroFrom}, ${c.heroTo})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    textWrap: 'balance',
  }

  const cta = (big = true) => (
    <a
      href="#final"
      className={`inline-flex items-center gap-2 ${big ? 'text-base' : 'text-sm'} font-semibold py-2 px-3 ${inner} bg-[var(--p-accent)] text-[var(--p-accent-text)] transition-[opacity,transform] hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--p-accent)]`}
      style={ease}
    >
      {spec.hero.cta}
      {big && <ArrowRightIcon weight="bold" aria-hidden />}
    </a>
  )

  return (
    <div
      ref={scroller}
      data-testid="preview-scroller"
      className="h-full overflow-y-auto overflow-x-hidden"
      style={vars}
    >
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>

      {/* B7 navigation: compact floating bar with translucent blur */}
      <nav aria-label="Primary" className="sticky top-3 z-20 flex justify-center px-3">
        <div
          className={`flex items-center ${mobile ? 'gap-3' : 'gap-6'} ${outer} border border-[var(--p-border)] py-2 pl-4 pr-2 backdrop-blur-md`}
          style={{ background: `color-mix(in srgb, ${c.bg} 72%, transparent)` }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className={`size-4 ${radiusClass(4)} bg-[var(--p-accent)]`} aria-hidden />
            {spec.nav.brand}
          </span>
          {!mobile && (
            <ul className="flex items-center gap-4 text-sm text-[var(--p-muted)]">
              {spec.nav.links.map((l, i) => (
                <li key={l}>
                  <a
                    href={`#${l.toLowerCase()}`}
                    aria-current={i === 0 ? 'page' : undefined}
                    className="transition-colors hover:text-[var(--p-text)] aria-[current=page]:text-[var(--p-text)]"
                    style={ease}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {cta(false)}
        </div>
      </nav>

      <main id="main">
        {/* HERO */}
        <section className={`${section} pt-16 text-center`} aria-labelledby="hero-h">
          <Reveal root={scroller} ms={t.motion.revealMs} className={`mx-auto flex max-w-[680px] flex-col items-center ${stack}`}>
            <h1
              id="hero-h"
              className={`${mobile ? 'text-4xl' : t.type.hero} font-semibold tracking-tight`}
              style={heroGradient}
            >
              {spec.hero.headlineLines.map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </h1>
            <p className={`${t.type.sub} max-w-[680px] text-[var(--p-muted)]`} style={{ textWrap: 'pretty' }}>
              {spec.hero.sub}
            </p>
            {cta()}
            <p className={`flex items-center gap-2 ${t.type.small} text-[var(--p-muted)]`}>
              <StarIcon weight="fill" aria-hidden className="text-[var(--p-accent)]" /> {spec.hero.proof}
            </p>
          </Reveal>

          {/* hero visual: outer shape + gap + inner shape shows the nested radius rule */}
          <Reveal root={scroller} ms={t.motion.revealMs} className="mx-auto mt-16 max-w-4xl">
            <div className={`${outer} ${inset} border border-[var(--p-border)] bg-[var(--p-surface)]`}>
              <div
                role="img"
                aria-label={spec.hero.visualAlt}
                className={`${inner} grid ${mobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3 border border-[var(--p-border)] bg-[var(--p-bg)] p-4 text-left`}
              >
                {spec.stats.map((s) => (
                  <div key={s.label} className={`${inner} bg-[var(--p-surface)] p-4`}>
                    <div className="text-xs text-[var(--p-muted)]">{s.label}</div>
                    <div className="mt-2 text-3xl font-semibold tabular-nums">{s.value}</div>
                    <div className="mt-4 flex h-12 items-end gap-1">
                      {[5, 8, 6, 9, 7, 11, 10, 12].map((h, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-xs bg-[var(--p-accent)]"
                          style={{ height: `${h * 4}px`, opacity: 0.25 + i * 0.09 }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* PROOF STRIP */}
        <section aria-label="Customers" id="customers" className="px-6 pb-16">
          <ul className={`mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 ${t.type.small} font-semibold text-[var(--p-muted)]`}>
            {spec.logos.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        {/* B11 TAGLINE REVEAL */}
        <section className={`${section}`} aria-label="Tagline">
          <div className="mx-auto max-w-[680px]">
            <TaglineReveal
              root={scroller}
              lines={spec.tagline}
              ms={t.motion.layoutMs}
              className={`${mobile ? 'text-4xl' : t.type.tagline} font-semibold tracking-tight`}
            />
          </div>
        </section>

        {/* PROBLEM → SOLUTION */}
        {!isC && (
          <section className={section} id="product">
            <Reveal root={scroller} ms={t.motion.revealMs} className={`mx-auto grid max-w-4xl ${mobile ? 'grid-cols-1' : 'grid-cols-2'} ${stack}`}>
              <h2 className={`${t.type.h2} font-semibold tracking-tight`} style={{ textWrap: 'balance' }}>
                {spec.problem.heading}
              </h2>
              <div className={`flex flex-col gap-4 ${t.type.body}`} style={{ textWrap: 'pretty' }}>
                <p className="text-[var(--p-muted)]">{spec.problem.before}</p>
                <p>{spec.problem.after}</p>
              </div>
            </Reveal>
          </section>
        )}

        {/* BENEFITS */}
        <section className={section} aria-labelledby="benefits-h">
          <div className="mx-auto max-w-4xl">
            <h2 id="benefits-h" className={`${t.type.h2} mb-8 font-semibold tracking-tight`}>
              What changes
            </h2>
            <div className={`grid ${mobile ? 'grid-cols-1' : 'grid-cols-2'} ${stack}`}>
              {spec.benefits.map((b, i) => {
                const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length]
                return (
                  <Reveal key={b.title} root={scroller} ms={t.motion.revealMs}>
                    <article className={`${outer} ${cardPad} h-full border border-[var(--p-border)] bg-[var(--p-surface)]`}>
                      <Icon size={24} aria-hidden className="text-[var(--p-accent)]" />
                      <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                      <p className={`mt-2 ${t.type.body} text-[var(--p-muted)]`} style={{ textWrap: 'pretty' }}>
                        {b.detail}
                      </p>
                    </article>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        {!isC && (
          <section className={section} aria-labelledby="how-h">
            <div className="mx-auto max-w-4xl">
              <h2 id="how-h" className={`${t.type.h2} mb-8 font-semibold tracking-tight`}>
                How it works
              </h2>
              <ol className={`grid ${mobile ? 'grid-cols-1' : 'grid-cols-3'} ${stack}`}>
                {spec.steps.map((s, i) => {
                  const Icon = STEP_ICONS[i]
                  return (
                    <Reveal key={s.title} root={scroller} ms={t.motion.revealMs}>
                      <li className="flex flex-col gap-3">
                        <span className={`flex size-10 items-center justify-center ${inner} bg-[var(--p-surface-alt)]`}>
                          <Icon size={20} aria-hidden />
                        </span>
                        <span className="text-xs font-semibold text-[var(--p-muted)]">Step {i + 1}</span>
                        <h3 className="text-lg font-semibold">{s.title}</h3>
                        <p className={`${t.type.body} text-[var(--p-muted)]`}>{s.detail}</p>
                      </li>
                    </Reveal>
                  )
                })}
              </ol>
            </div>
          </section>
        )}

        {/* SOCIAL PROOF */}
        {!isC && (
          <section className={section} aria-labelledby="proof-h">
            <div className="mx-auto max-w-4xl">
              <h2 id="proof-h" className={`${t.type.h2} mb-8 font-semibold tracking-tight`}>
                From people who switched
              </h2>
              <div className={`grid ${mobile ? 'grid-cols-1' : 'grid-cols-3'} ${stack}`}>
                {spec.testimonials.map((q) => (
                  <Reveal key={q.name} root={scroller} ms={t.motion.revealMs}>
                    <figure className={`${outer} ${cardPad} flex h-full flex-col justify-between gap-6 border border-[var(--p-border)]`}>
                      <blockquote className={`${t.type.body}`} style={{ textWrap: 'pretty' }}>
                        “{q.quote}”
                      </blockquote>
                      <figcaption className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-10 items-center justify-center rounded-full bg-[var(--p-surface-alt)] text-sm font-semibold"
                        >
                          {q.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                        <span className="text-sm">
                          <span className="block font-semibold">{q.name}</span>
                          <span className="text-[var(--p-muted)]">
                            {q.role}, {q.company}
                          </span>
                        </span>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className={section} id="faq" aria-labelledby="faq-h">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-h" className={`${t.type.h2} mb-8 font-semibold tracking-tight`}>
              Questions people ask first
            </h2>
            <div className={`${outer} ${inset} border border-[var(--p-border)] bg-[var(--p-surface)]`}>
              {spec.faq.map((f, i) => {
                const open = openFaq === i
                return (
                  <div key={f.q} className={`${inner} ${open ? 'bg-[var(--p-bg)]' : ''} transition-colors`} style={ease}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      className={`flex w-full items-center justify-between gap-4 ${inner} px-4 py-3 text-left text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p-accent)]`}
                    >
                      {f.q}
                      <CaretDownIcon
                        aria-hidden
                        className="shrink-0 transition-transform"
                        style={{ ...ease, transitionDuration: `${t.motion.layoutMs}ms`, transform: open ? 'rotate(180deg)' : 'none' }}
                      />
                    </button>
                    {open && <p className={`px-4 pb-4 ${t.type.body} text-[var(--p-muted)]`}>{f.a}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* RISK REVERSAL + FINAL CTA */}
        <section className={section} id="final" aria-labelledby="final-h">
          <Reveal root={scroller} ms={t.motion.revealMs} className="mx-auto max-w-4xl">
            <div className={`${outer} ${PAD[32] ?? 'p-8'} flex flex-col items-center gap-6 border border-[var(--p-border)] bg-[var(--p-surface)] text-center`}>
              <h2 id="final-h" className={`${t.type.h2} max-w-[680px] font-semibold tracking-tight`} style={{ textWrap: 'balance' }}>
                {spec.finalCta.heading}
              </h2>
              {cta()}
              <ul className={`flex flex-wrap justify-center gap-x-6 gap-y-2 ${t.type.small} text-[var(--p-muted)]`}>
                {spec.risk.map((r) => (
                  <li key={r} className="flex items-center gap-2">
                    <CheckCircleIcon aria-hidden /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      </main>

      <footer id="pricing" className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--p-border)] px-6 py-8 text-sm text-[var(--p-muted)]">
        <span>© 2026 {spec.nav.brand}</span>
        <span className="flex gap-4">
          <a href="#main" className="hover:text-[var(--p-text)]">Privacy policy</a>
          <a href="#main" className="hover:text-[var(--p-text)]">Terms</a>
        </span>
      </footer>
    </div>
  )
}
