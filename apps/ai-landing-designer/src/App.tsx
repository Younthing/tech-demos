import { useEffect, useMemo, useState } from 'react'
import { ArrowClockwiseIcon, DesktopIcon, DeviceMobileIcon } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SAMPLE_INTAKE, generate, type Intake } from '@/engine/generate'
import { PRESET_LIST, type ToneId } from '@/engine/presets'
import { IntakeForm } from '@/features/intake/IntakeForm'
import { LandingPreview } from '@/features/preview/LandingPreview'
import { TokensPanel } from '@/features/tokens/TokensPanel'

const STORE = 'ai-landing-designer:intake'

function PreviewSkeleton() {
  return (
    <div className="flex h-full flex-col items-center gap-6 p-16" aria-busy="true" aria-label="Generating preview">
      <div className="h-8 w-80 animate-pulse rounded-md bg-muted" />
      <div className="h-12 w-[28rem] max-w-full animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
      <div className="mt-6 h-56 w-full max-w-3xl animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

export default function App() {
  const [intake, setIntake] = useState<Intake>(() => {
    try {
      return { ...SAMPLE_INTAKE, ...JSON.parse(localStorage.getItem(STORE) ?? '{}') }
    } catch {
      return SAMPLE_INTAKE
    }
  })
  const [tone, setTone] = useState<ToneId>(() => (new URLSearchParams(location.search).get('tone') as ToneId) || 'editorial')
  const [seed, setSeed] = useState(0)
  const [mobile, setMobile] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => localStorage.setItem(STORE, JSON.stringify(intake)), [intake])

  // brief skeleton on tone switch / regenerate (B9 loading state)
  const flash = () => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 350)
  }

  const spec = useMemo(() => generate(intake, tone, seed), [intake, tone, seed])

  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col bg-background text-foreground">
        <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
          <div className="mr-2">
            <h1 className="text-sm font-semibold">AI Landing Designer</h1>
            <p className="text-xs text-muted-foreground">
              landing-page-design skill → deterministic page + tokens
            </p>
          </div>
          <Tabs
            value={tone}
            onValueChange={(v) => {
              setTone(v as ToneId)
              flash()
            }}
          >
            <TabsList>
              {PRESET_LIST.map((p) => (
                <TabsTrigger key={p.id} value={p.id} data-testid={`tone-${p.id}`}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            data-testid="regenerate"
            onClick={() => {
              setSeed((s) => s + 1)
              flash()
            }}
          >
            <ArrowClockwiseIcon /> Regenerate
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline">
              Layout {spec.layout.type} · {spec.layout.name}
            </Badge>
            <Button variant={mobile ? 'outline' : 'secondary'} size="icon-sm" aria-label="Desktop width" onClick={() => setMobile(false)}>
              <DesktopIcon />
            </Button>
            <Button variant={mobile ? 'secondary' : 'outline'} size="icon-sm" aria-label="Mobile width" onClick={() => setMobile(true)}>
              <DeviceMobileIcon />
            </Button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr_360px]">
          <aside className="overflow-y-auto border-r p-4" aria-label="Intake">
            <h2 className="mb-1 text-sm font-semibold">Intake</h2>
            <p className="mb-4 text-xs text-muted-foreground">Skill §A1, trimmed. Missing answers get a stated assumption.</p>
            <IntakeForm value={intake} onChange={setIntake} />
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setIntake(SAMPLE_INTAKE)}>
              Reset to sample
            </Button>
          </aside>

          <section className="flex min-h-0 justify-center bg-muted/50 p-4" aria-label="Preview">
            <div
              className="min-h-0 w-full overflow-hidden rounded-xl border bg-background shadow-sm transition-[max-width] duration-500"
              style={{ maxWidth: mobile ? 390 : 1200, transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }}
            >
              {loading ? (
                <PreviewSkeleton />
              ) : (
                <LandingPreview key={`${tone}-${seed}-${mobile}`} spec={spec} mobile={mobile} />
              )}
            </div>
          </section>

          <aside className="flex min-h-0 flex-col border-l p-4" aria-label="Design tokens">
            <p className="mb-2 text-xs text-muted-foreground">{spec.tone.blurb}</p>
            <div className="min-h-0 flex-1">
              <TokensPanel spec={spec} />
            </div>
          </aside>
        </div>
      </div>
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}
