import type { LogEntry, Task } from "../timer/types.ts"

export type DayBar = { start: number; minutes: number }

export type FocusStats = {
  todayMinutes: number
  todayCount: number
  weekMinutes: number
  monthMinutes: number
  days: DayBar[]
}

export function startOfLocalDay(now: number): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function focusStats(log: LogEntry[], now: number): FocusStats {
  const day = startOfLocalDay(now)
  const week = day - 6 * 86_400_000
  const month = day - 29 * 86_400_000
  const focus = log.filter((entry) => entry.mode === "focus")
  const between = (from: number, to: number) =>
    focus.filter((entry) => entry.endedAt >= from && entry.endedAt < to)
  const minutes = (entries: LogEntry[]) =>
    Math.round(entries.reduce((sum, entry) => sum + entry.durationMs, 0) / 60_000)
  const today = between(day, day + 86_400_000)
  const days = Array.from({ length: 7 }, (_, index) => {
    const start = week + index * 86_400_000
    return { start, minutes: minutes(between(start, start + 86_400_000)) }
  })
  return {
    todayMinutes: minutes(today),
    todayCount: today.length,
    weekMinutes: minutes(between(week, day + 86_400_000)),
    monthMinutes: minutes(between(month, day + 86_400_000)),
    days,
  }
}

export function sessionsCsv(log: LogEntry[], tasks: Task[]): string {
  const names = new Map(tasks.map((task) => [task.id, task.title]))
  const lines = ["ended_at_iso,mode,minutes,task"]
  for (const entry of log) {
    const title = entry.taskId ? (names.get(entry.taskId) ?? "") : ""
    lines.push(
      `${new Date(entry.endedAt).toISOString()},${entry.mode},${(entry.durationMs / 60_000).toFixed(2)},"${title.replaceAll('"', '""')}"`,
    )
  }
  return lines.join("\n")
}
