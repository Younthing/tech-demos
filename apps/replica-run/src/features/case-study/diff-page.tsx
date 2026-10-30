import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import parityFile from "../../../replica/parity.json"
import behaviourFile from "../../../replica/behaviour.json"
import bugsFile from "../../../replica/bugs.json"
import studyFile from "../../../replica/about.json"
import originalDesktop from "../../../replica/screens/S01-desktop.png"
import originalMobile from "../../../replica/screens/S01-mobile.png"
import originalTask from "../../../replica/screens/S04-desktop.png"
import cloneDesktop from "../../../replica/clone-screens/S01-desktop.png"
import cloneMobile from "../../../replica/clone-screens/S01-mobile.png"
import cloneTask from "../../../replica/clone-screens/S04-desktop.png"
import diffDesktop from "../../../replica/diffs/S01-desktop.png"
import diffMobile from "../../../replica/diffs/S01-mobile.png"
import diffTask from "../../../replica/diffs/S04-desktop.png"
import { StudyShell } from "./study-shell.tsx"

type Row = { feature: string; area: string; priority: string; clone: string; notes: string }
type ParityFile = {
  feature_score: number
  overall: number
  counted: number
  must_have_done: number
  must_have_total: number
  layout_score?: number
  by_area: { area: string; score: number; features: number }[]
  missing: Row[]
  skipped: Row[]
  extras: Row[]
  visual?: { file: string; score: number; mode: string }[]
}

const parity = parityFile as ParityFile
const behaviour = behaviourFile as { rows: { flow: string; original: string; clone: string; decision: string }[] }
const bugs = bugsFile as { openS1: number; openS2: number; openS3: number; openS4: number }
const study = studyFile as { subject: string }

const shots = [
  {
    id: "S01-desktop",
    title: "Timer, idle, 1440×900",
    original: originalDesktop,
    clone: cloneDesktop,
    diff: diffDesktop,
  },
  {
    id: "S01-mobile",
    title: "Timer, idle, 390×844",
    original: originalMobile,
    clone: cloneMobile,
    diff: diffMobile,
  },
  {
    id: "S04-desktop",
    title: "One open task, 1440×900",
    original: originalTask,
    clone: cloneTask,
    diff: diffTask,
  },
]

function verdict(featureScore: number, mustDone: number, mustTotal: number, fixes: number): string {
  if (mustDone < mustTotal || bugs.openS1 > 0) return "Not shippable"
  if (featureScore >= 80 && bugs.openS2 === 0 && fixes > 0) return "Better than the original"
  if (featureScore >= 80 && bugs.openS2 === 0) return "Shippable"
  return "Not shippable"
}

export function DiffPage() {
  const fixes = parity.extras.filter((row) => row.clone === "yes" || row.clone === "partial").length
  const word = verdict(parity.feature_score, parity.must_have_done, parity.must_have_total, fixes)
  const layout = "layout_score" in parity ? parity.layout_score : null

  return (
    <StudyShell>
      <p className="text-sm text-muted-foreground">Case study of {study.subject}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Parity</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Feature numbers come from the vendored parity tool. Layout numbers come from the vendored
        image diff in layout mode, which ignores colour. The palette difference is intentional.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Score label="Overall" value={parity.overall} hint="80% features, 20% layout" />
        <Score label="Features" value={parity.feature_score} hint={`${parity.counted} rows counted`} />
        <Score label="Layout" value={layout ?? null} hint={parity.visual ? `${parity.visual.length} screens` : "No screens yet"} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            Verdict
            <Badge variant={word === "Not shippable" ? "destructive" : "secondary"}>{word}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Must-haves {parity.must_have_done} of {parity.must_have_total}. Open bugs: S1 {bugs.openS1}, S2{" "}
          {bugs.openS2}, S3 {bugs.openS3}, S4 {bugs.openS4}. Shipped additions outside the original: {fixes}.
          Shippable means every must-have is done, the feature score is at least 80, and no S1 or S2 is open.
          Better than the original also needs at least one of those additions.
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Areas, weakest first</h2>
        <ul className="mt-3 grid gap-3">
          {parity.by_area.map((area) => (
            <li key={area.area} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm">
              <span>{area.area}</span>
              <Progress value={area.score} aria-label={`${area.area} ${area.score}`} />
              <span className="text-right tabular-nums">{area.score}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Missing, in build order</h2>
        {parity.missing.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing counted is unfinished.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {parity.missing.map((row) => (
              <li key={`${row.area}-${row.feature}`}>
                [{row.priority}] {row.area}: {row.feature} ({row.clone}
                {row.notes ? `, ${row.notes}` : ""})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Left out on purpose</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {parity.skipped.map((row) => (
            <li key={row.feature}>
              {row.feature}
              {row.notes ? ` — ${row.notes}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Behaviour</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Written from using both apps. The parity tool does not score this table.
        </p>
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead>Flow</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Ripen</TableHead>
              <TableHead>Call</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {behaviour.rows.map((row) => (
              <TableRow key={row.flow}>
                <TableCell className="align-top font-medium">{row.flow}</TableCell>
                <TableCell className="align-top">{row.original}</TableCell>
                <TableCell className="align-top">{row.clone}</TableCell>
                <TableCell className="align-top">{row.decision}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="mt-8 grid gap-8">
        <h2 className="text-lg font-semibold">Same viewport, same state</h2>
        {shots.map((shot) => {
          const visual = parity.visual?.find((item) => item.file.includes(shot.id))
          return (
            <figure key={shot.id} className="grid gap-3">
              <figcaption className="text-sm font-medium">
                {shot.title}
                {visual ? ` · layout ${visual.score}` : ""}
              </figcaption>
              <div className="grid gap-3 lg:grid-cols-3">
                <Shot src={shot.original} label={`Original, ${shot.title}`} />
                <Shot src={shot.clone} label={`Ripen, ${shot.title}`} />
                <Shot src={shot.diff} label={`Layout diff, ${shot.title}`} />
              </div>
            </figure>
          )
        })}
      </section>
    </StudyShell>
  )
}

function Score({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value == null ? "—" : value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function Shot({ src, label }: { src: string; label: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border bg-muted">
      <img src={src} alt={label} className="h-auto w-full" />
      <figcaption className="px-2 py-1 text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  )
}
