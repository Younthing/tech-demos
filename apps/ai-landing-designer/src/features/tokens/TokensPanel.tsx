import { useState } from 'react'
import { toast } from 'sonner'
import { CheckIcon, XIcon, CopyIcon, PlayIcon } from 'lucide-react'
import type { PageSpec } from '@/engine/generate'
import { outlineMarkdown } from '@/engine/generate'
import { runChecklist } from '@/engine/checklist'
import { BASE_CURVE, BASE_CURVE_POINTS, SPACING, TYPE_SCALE, nestedRadius, radiusClass } from '@/engine/rules'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

function CurvePlot() {
  const [x1, y1, x2, y2] = BASE_CURVE_POINTS
  const s = 96
  const d = `M0 ${s} C ${x1 * s} ${s - y1 * s}, ${x2 * s} ${s - y2 * s}, ${s} 0`
  return (
    <svg width={s} height={s} viewBox={`-4 -4 ${s + 8} ${s + 8}`} className="shrink-0 rounded-md border bg-muted/40" aria-label="Base curve plot">
      <path d={`M0 ${s} L ${s} 0`} stroke="currentColor" strokeOpacity={0.15} fill="none" />
      <path d={d} stroke="currentColor" strokeWidth={2} fill="none" />
    </svg>
  )
}

export function TokensPanel({ spec }: { spec: PageSpec }) {
  const t = spec.tone
  const checks = runChecklist(spec)
  const passed = checks.filter((c) => c.pass).length
  const usedType = new Set(Object.values(t.type))
  const usedSpacing = new Set<number>([...Object.values(t.spacing), 4, 8, 12, 16, 64])
  const innerPx = nestedRadius(t.radius.outerPx, t.radius.gapPx)
  const [play, setPlay] = useState(0)

  return (
    <Tabs defaultValue="tokens" className="flex h-full flex-col">
      <TabsList className="w-full">
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
        <TabsTrigger value="checklist">
          Checklist <Badge variant="secondary">{passed}/{checks.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="outline">Outline</TabsTrigger>
      </TabsList>

      <TabsContent value="tokens" className="flex flex-col gap-6 overflow-y-auto pr-1 pb-6" data-testid="tokens">
        <Section title={`Typeface · ${t.font.name}`}>
          <p className="text-2xl" style={{ fontFamily: t.font.css }}>
            Aa Bb 0123 <span className="font-semibold">Semibold</span>
          </p>
          <p className="text-xs text-muted-foreground">One typeface, no italics, weight capped at bold (B1).</p>
        </Section>

        <Section title="Type scale">
          <ul className="flex flex-col">
            {TYPE_SCALE.slice(0, 10).map((s) => {
              const used = usedType.has(s.cls)
              const roles = Object.entries(t.type)
                .filter(([, v]) => v === s.cls)
                .map(([k]) => k)
              return (
                <li key={s.cls} className={`flex items-baseline justify-between gap-2 border-b py-1 ${used ? '' : 'opacity-35'}`}>
                  <span className="font-mono text-xs">{s.cls}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.px}/{s.lh}
                  </span>
                  <span className="ml-auto flex gap-1">
                    {roles.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </span>
                </li>
              )
            })}
          </ul>
        </Section>

        <Section title="Spacing (B2 only)">
          <ul className="flex flex-col gap-1">
            {SPACING.slice(1).map((s) => (
              <li key={s.token} className={`flex items-center gap-2 ${usedSpacing.has(s.px) ? '' : 'opacity-35'}`}>
                <span className="w-24 font-mono text-xs">{s.token}</span>
                <span className="h-2 rounded-xs bg-foreground" style={{ width: s.px }} />
                <span className="text-xs text-muted-foreground">{s.px}px</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Radius · nested formula (B3)">
          <div className="flex items-center gap-4">
            <div
              className={`${radiusClass(t.radius.outerPx)} border-2 border-foreground/70 bg-muted`}
              style={{ padding: t.radius.gapPx }}
            >
              <div className={`${radiusClass(innerPx)} size-16 border-2 border-dashed border-foreground/70 bg-background`} />
            </div>
            <div className="font-mono text-xs leading-5">
              outer {t.radius.outerPx}px <span className="text-muted-foreground">{radiusClass(t.radius.outerPx)}</span>
              <br />− gap {t.radius.gapPx}px
              <br />= inner {innerPx ?? 'square'}px <span className="text-muted-foreground">{radiusClass(innerPx)}</span>
            </div>
          </div>
        </Section>

        <Section title="Motion (B7)">
          <div className="flex items-center gap-4">
            <CurvePlot />
            <div className="flex flex-col gap-1 font-mono text-xs">
              <span>{BASE_CURVE}</span>
              <span>layout {t.motion.layoutMs}ms · hover {t.motion.hoverMs}ms</span>
              <span>reveal {t.motion.revealMs}ms, rise {t.motion.riseOffsetPx}px</span>
              <span>tagline per word, IntersectionObserver</span>
            </div>
          </div>
          <div className="relative h-8 rounded-md border bg-muted/40">
            <span
              key={play}
              className="absolute top-2 left-2 size-4 rounded-full bg-foreground motion-safe:animate-[slide_var(--d)_var(--e)_forwards]"
              style={{ ['--d' as string]: `${t.motion.layoutMs * 2}ms`, ['--e' as string]: BASE_CURVE }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setPlay((p) => p + 1)} className="self-start">
            <PlayIcon /> Replay curve
          </Button>
        </Section>

        <Section title={`Palette · ${t.theme}`}>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(t.colors).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <span className="h-8 rounded-md border" style={{ background: v }} />
                <span className="truncate text-xs text-muted-foreground">{k}</span>
                <span className="font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </Section>
      </TabsContent>

      <TabsContent value="checklist" className="flex flex-col gap-4 overflow-y-auto pb-6">
        {(['Strategy', 'Visual', 'Content'] as const).map((g) => (
          <Section key={g} title={g}>
            <ul className="flex flex-col gap-2">
              {checks
                .filter((c) => c.group === g)
                .map((c) => (
                  <li key={c.label} className="flex gap-2 text-sm">
                    {c.pass ? (
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <span>
                      {c.label}
                      {c.detail && <span className="block text-xs text-muted-foreground">{c.detail}</span>}
                    </span>
                  </li>
                ))}
            </ul>
          </Section>
        ))}
        {spec.assumptions.length > 0 && (
          <Section title="Assumptions">
            <ul className="list-disc pl-4 text-sm text-muted-foreground">
              {spec.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Section>
        )}
      </TabsContent>

      <TabsContent value="outline" className="flex min-h-0 flex-col gap-2 pb-6">
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(outlineMarkdown(spec))
              toast.success('Outline copied as Markdown')
            } catch {
              toast.error('Copy failed. Select the text below and copy it manually.')
            }
          }}
        >
          <CopyIcon /> Copy Markdown
        </Button>
        <pre className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
          {outlineMarkdown(spec)}
        </pre>
      </TabsContent>
    </Tabs>
  )
}
