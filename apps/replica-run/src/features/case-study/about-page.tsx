import studyFile from "../../../replica/about.json"
import { StudyShell } from "./study-shell.tsx"

type Step = { id: string; ran: boolean; title: string; note: string; artifact?: string }
const study = studyFile as {
  subject: string
  subjectUrl: string
  upstream: string
  pipeline: Step[]
}

export function AboutPage() {
  const ran = study.pipeline.filter((step) => step.ran)
  const skipped = study.pipeline.filter((step) => !step.ran)

  return (
    <StudyShell>
      <p className="text-sm text-muted-foreground">Case study of {study.subject}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Pipeline</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Ripen is an independent timer. It is not affiliated with {study.subject}. The method and the
        scoring tools are replica-skill by Jake Schincariol, MIT, vendored in this app at commit{" "}
        {study.upstream}.
      </p>
      <p className="mt-3 text-sm">
        Public page used for the study:{" "}
        <a className="underline" href={study.subjectUrl}>
          {study.subjectUrl}
        </a>
      </p>

      <h2 className="mt-8 text-lg font-semibold">Steps that ran</h2>
      <ol className="mt-3 grid gap-3">
        {ran.map((step) => (
          <li key={step.id} className="rounded-lg border p-4 text-sm">
            <p className="font-medium">{step.title}</p>
            <p className="mt-1 text-muted-foreground">{step.note}</p>
            <p className="mt-2 text-xs">Artifact: {step.artifact}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-8 text-lg font-semibold">Steps that were skipped</h2>
      <ul className="mt-3 grid gap-3">
        {skipped.map((step) => (
          <li key={step.id} className="rounded-lg border p-4 text-sm">
            <p className="font-medium">{step.title}</p>
            <p className="mt-1 text-muted-foreground">{step.note}</p>
          </li>
        ))}
      </ul>
    </StudyShell>
  )
}
