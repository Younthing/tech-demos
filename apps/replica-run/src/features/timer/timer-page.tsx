import { Link } from "react-router"
import { BarChart3, Leaf, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatClock, formatFinish, modeLabel } from "./format.ts"
import { ReportDialog } from "../report/report-dialog.tsx"
import { TaskList } from "../tasks/task-list.tsx"
import { SettingsDialog } from "./settings-dialog.tsx"
import { MODES } from "./types.ts"
import { useRipen } from "./use-ripen.ts"
import { useState } from "react"

export function TimerPage() {
  const { store, now, remaining, finish, storageError, dispatch, update, unlockSound } = useRipen()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const active = store.tasks.find((task) => task.id === store.activeId) ?? null
  const phase = store.timer.phase
  const primary = phase === "running" ? "Pause" : phase === "paused" ? "Resume" : "Begin"

  return (
    <div className="ripen min-h-screen" data-mode={store.timer.mode}>
      <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pb-16 pt-6">
        <header className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 font-medium tracking-tight" aria-label="Ripen home">
            <Leaf className="size-5" aria-hidden="true" />
            Ripen
          </Link>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              className="text-[var(--ripen-ink)] hover:bg-white/10"
              onClick={() => setReportOpen(true)}
            >
              <BarChart3 aria-hidden="true" />
              <span className="max-[420px]:sr-only">Report</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-[var(--ripen-ink)] hover:bg-white/10"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings aria-hidden="true" />
              <span className="max-[420px]:sr-only">Settings</span>
            </Button>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-sm [&::-webkit-details-marker]:hidden">
                More
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border border-[var(--ripen-line)] bg-[var(--ripen-card)] p-2 text-sm shadow-lg">
                <Link className="block rounded px-2 py-1 hover:bg-white/10" to="/diff">
                  Parity study
                </Link>
                <Link className="block rounded px-2 py-1 hover:bg-white/10" to="/fixes">
                  Complaints
                </Link>
                <Link className="block rounded px-2 py-1 hover:bg-white/10" to="/about">
                  Pipeline
                </Link>
                <button
                  type="button"
                  className="mt-2 block w-full rounded px-2 py-1 text-left hover:bg-white/10"
                  onClick={() => dispatch({ type: "nudge", deltaMs: -60_000, now: Date.now() })}
                >
                  Drop a minute
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-2 py-1 text-left hover:bg-white/10"
                  onClick={() => dispatch({ type: "nudge", deltaMs: 60_000, now: Date.now() })}
                >
                  Add a minute
                </button>
                <p className="mt-2 border-t border-[var(--ripen-line)] px-2 pt-2 text-xs text-[var(--ripen-muted)]">
                  Space starts and pauses while you are not typing.
                </p>
              </div>
            </details>
          </div>
        </header>

        <h1 className="sr-only">Ripen focus timer</h1>
        {storageError && (
          <p role="alert" className="mt-4 text-sm">
            This browser refused to store the session.
          </p>
        )}

        <Card className="mt-10 border-0 bg-[var(--ripen-card)] text-[var(--ripen-ink)] shadow-none ring-0">
          <div role="tablist" aria-label="Interval" className="flex justify-center gap-1">
            {MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={store.timer.mode === mode}
                className={`rounded-md px-3 py-1 text-sm ${
                  store.timer.mode === mode
                    ? "bg-[var(--ripen-chip)] text-[var(--ripen-ink)]"
                    : "text-[var(--ripen-muted)]"
                }`}
                onClick={() => dispatch({ type: "set-mode", mode, now: Date.now() })}
              >
                {modeLabel(mode)}
              </button>
            ))}
          </div>
          <p
            role="timer"
            aria-label={`${formatClock(remaining)} remaining`}
            className="py-4 text-center text-7xl leading-none font-medium tabular-nums tracking-tight sm:text-8xl"
          >
            {formatClock(remaining)}
          </p>
          <Button
            type="button"
            className="h-12 w-full text-base font-semibold hover:opacity-90"
            style={{ background: "var(--ripen-btn)", color: "var(--ripen-btn-ink)" }}
            aria-keyshortcuts="Space"
            onClick={() => {
              unlockSound()
              dispatch({ type: "toggle", now: Date.now() })
            }}
          >
            {primary}
          </Button>
          {phase !== "idle" && (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full text-[var(--ripen-ink)] hover:bg-white/10"
              onClick={() => dispatch({ type: "skip", now: Date.now() })}
            >
              Skip
            </Button>
          )}
        </Card>

        <div className="mt-6 text-center text-sm">
          <p>{active ? `#${store.tasks.findIndex((task) => task.id === active.id) + 1}` : "Ready"}</p>
          <p className="mt-1">{active ? active.title : "No task selected"}</p>
          <p className="sr-only" aria-live="polite">
            {modeLabel(store.timer.mode)}. {phase === "running" ? "Running" : phase === "paused" ? "Paused" : "Ready"}.
          </p>
        </div>

        <TaskList store={store} now={now} onChange={update} />
        {store.tasks.some((task) => !task.done) && (
          <p className="mt-3 rounded-md bg-white/15 px-3 py-2 text-center text-sm">
            Blocks {store.tasks.filter((task) => !task.done).reduce((sum, task) => sum + task.doneCount, 0)}/
            {store.tasks.filter((task) => !task.done).reduce((sum, task) => sum + task.estimate, 0)}
            {finish == null ? "" : ` · Wraps up around ${formatFinish(finish)}`}
          </p>
        )}
      </main>

      <SettingsDialog
        open={settingsOpen}
        settings={store.settings}
        onOpenChange={setSettingsOpen}
        onSave={(next, prev) => dispatch({ type: "apply-settings", settings: next, prev, now: Date.now() })}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        log={store.log}
        tasks={store.tasks}
        now={now}
      />
    </div>
  )
}
