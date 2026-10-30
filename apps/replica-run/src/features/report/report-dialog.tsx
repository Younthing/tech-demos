import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { focusStats, sessionsCsv } from "./stats.ts"
import type { LogEntry, Task } from "../timer/types.ts"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: LogEntry[]
  tasks: Task[]
  now: number
}

export function ReportDialog({ open, onOpenChange, log, tasks, now }: Props) {
  const stats = focusStats(log, now)
  const peak = Math.max(1, ...stats.days.map((day) => day.minutes))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Focus report</DialogTitle>
          <DialogDescription>
            Minutes are the clock time of finished focus blocks stored in this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat
            label="Today"
            value={`${stats.todayMinutes} min`}
            detail={`${stats.todayCount} ${stats.todayCount === 1 ? "block" : "blocks"}`}
          />
          <Stat label="7 days" value={`${stats.weekMinutes} min`} detail="including today" />
          <Stat label="30 days" value={`${stats.monthMinutes} min`} detail="including today" />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Last 7 days</p>
          <div className="grid grid-cols-7 gap-2" aria-label="Seven day focus heatmap">
            {stats.days.map((day) => (
              <div key={day.start} className="grid justify-items-center gap-1">
                <div
                  className="size-8 rounded-md bg-primary"
                  style={{ opacity: day.minutes === 0 ? 0.12 : 0.25 + (day.minutes / peak) * 0.75 }}
                  title={`${day.minutes} minutes`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(day.start).toLocaleDateString([], { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
          <ul className="grid gap-2">
            {stats.days.map((day) => (
              <li key={`bar-${day.start}`} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {new Date(day.start).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
                <Progress value={Math.round((day.minutes / peak) * 100)} aria-label={`${day.minutes} minutes`} />
                <span className="text-right">{day.minutes}m</span>
              </li>
            ))}
          </ul>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => download(sessionsCsv(log, tasks))}
        >
          Download session log
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function download(csv: string) {
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "ripen-sessions.csv"
  link.click()
  URL.revokeObjectURL(url)
}
