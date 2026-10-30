import { modeDurationMs, viewRemaining, type Settings, type Task, type TimerState } from "./types.ts"

/**
 * Wall-clock moment the open focus blocks would end, including the rests
 * that sit between them. Returns null when there is nothing left to finish.
 */
export function finishAt(
  now: number,
  tasks: Task[],
  activeId: string | null,
  settings: Settings,
  timer: TimerState,
): number | null {
  let left = tasks
    .filter((task) => !task.done)
    .reduce((sum, task) => sum + Math.max(0, task.estimate - task.doneCount), 0)

  const inFocus = timer.mode === "focus" && timer.phase !== "idle"
  if (left === 0 && !inFocus) return null

  const focusMs = modeDurationMs(settings, "focus")
  const shortMs = modeDurationMs(settings, "short")
  const longMs = modeDurationMs(settings, "long")
  const every = Math.max(1, settings.longEvery)
  let total = 0
  let streak = timer.focusStreak

  const takeBreak = () => {
    total += streak % every === 0 ? longMs : shortMs
    if (streak % every === 0) streak = 0
  }

  if (inFocus) {
    const active = tasks.find((task) => task.id === activeId)
    const activeHasRoom =
      !!active && !active.done && active.estimate - active.doneCount > 0
    total += viewRemaining(timer, now)
    if (activeHasRoom) left -= 1
    streak += 1
    if (left > 0) takeBreak()
  } else if (timer.mode !== "focus" && timer.phase !== "idle") {
    total += viewRemaining(timer, now)
  }

  for (let i = 0; i < left; i += 1) {
    total += focusMs
    streak += 1
    if (i < left - 1) takeBreak()
  }

  return now + total
}
