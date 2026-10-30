import { Badge } from "@/components/ui/badge"
import feedbackFile from "../../../replica/feedback.json"
import fixes from "../../../replica/fixes.md?raw"
import studyFile from "../../../replica/about.json"
import { Markdown } from "./markdown.tsx"
import { StudyShell } from "./study-shell.tsx"

type Quote = { quote: string; url: string; source: string; rating: number | null }
type Theme = {
  id: string
  label: string
  kind: string
  score: number
  count: number
  sources: string[]
  thin: boolean
  quotes: Quote[]
}
type Feedback = {
  reviews: number
  sources: string[]
  rated: number
  dropped: number
  duplicates: number
  themes: Theme[]
  requests: Quote[]
  unthemed_negative: { url: string; source: string; rating: number | null; text: string }[]
}

const feedback = feedbackFile as Feedback
const study = studyFile as { subject: string }

export function FixesPage() {
  const complaints = feedback.themes.filter((theme) => theme.kind === "complaint")
  const requests = feedback.themes.filter((theme) => theme.kind === "request")

  return (
    <StudyShell>
      <p className="text-sm text-muted-foreground">Case study of {study.subject}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Complaints</h1>
      <p className="mt-3 max-w-2xl text-sm">
        These lines are public comments about {study.subject}, copied verbatim and linked. They are
        research. They are not endorsements of Ripen.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Sample: {feedback.reviews} reviews from {feedback.sources.length} sources ({feedback.sources.join(", ")}
        ). {feedback.rated} had star ratings. {feedback.dropped} rows dropped, {feedback.duplicates} duplicates
        removed.
        {feedback.reviews < 30
          ? " This sample is under 30. It can suggest a direction. It cannot rank a roadmap."
          : ""}
      </p>

      <ThemeList title="What they hate" themes={complaints} />
      <ThemeList title="What they ask for" themes={requests} />

      {feedback.requests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Asked for in their own words</h2>
          <ul className="mt-3 grid gap-3">
            {feedback.requests.map((item) => (
              <li key={item.url + item.quote} className="text-sm">
                “{item.quote}”{" "}
                <a className="underline" href={item.url} target="_blank" rel="noreferrer">
                  {item.source}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {feedback.unthemed_negative.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Low ratings that matched no theme</h2>
          <ul className="mt-3 grid gap-3 text-sm">
            {feedback.unthemed_negative.map((item) => (
              <li key={item.url}>
                “{item.text}”{" "}
                <a className="underline" href={item.url} target="_blank" rel="noreferrer">
                  {item.source}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Fix plan and angle</h2>
        <div className="mt-4">
          <Markdown source={fixes} />
        </div>
      </section>
    </StudyShell>
  )
}

function ThemeList({
  title,
  themes,
}: {
  title: string
  themes: Theme[]
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {themes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing matched.</p>
      ) : (
        <ul className="mt-3 grid gap-4">
          {themes.map((theme) => (
            <li key={theme.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{theme.label}</h3>
                {theme.thin && <Badge variant="outline">Thin</Badge>}
                <span className="text-xs text-muted-foreground">
                  {theme.count} reviews · {theme.sources.length} sources · score {theme.score}
                </span>
              </div>
              <ul className="mt-3 grid gap-2">
                {theme.quotes.map((quote) => (
                  <li key={quote.url + quote.quote} className="text-sm">
                    “{quote.quote}”{" "}
                    <a className="underline" href={quote.url} target="_blank" rel="noreferrer">
                      {quote.source}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
