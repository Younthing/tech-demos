import { applySession, defaultStore } from "../src/features/timer/session.ts"
import { freshTimer, viewRemaining, type Settings, type Task } from "../src/features/timer/types.ts"
import { finishAt } from "../src/features/timer/finish.ts"
import { focusStats, sessionsCsv } from "../src/features/report/stats.ts"
import { creditActive, openBlocks } from "../src/features/tasks/model.ts"
import { describe, expect, it } from "vitest"

const minute = 60_000

function task(partial: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Draft notes",
    estimate: 1,
    doneCount: 0,
    done: false,
    createdAt: 0,
    ...partial,
  }
}

describe("timer reducer", () => {
  it("keeps remaining time from the end timestamp, with no interval ticks", () => {
    const start = 1_000_000
    let store = applySession(defaultStore(), { type: "start", now: start })
    const duration = store.timer.segmentMs
    expect(store.timer.phase).toBe("running")
    expect(store.timer.endsAt).toBe(start + duration)
    expect(viewRemaining(store.timer, start + 123_456)).toBe(duration - 123_456)
    expect(store.timer.endsAt).toBe(start + duration)
  })

  it("pauses without losing the remaining time, then resumes from that remainder", () => {
    const start = 5_000
    let store = applySession(defaultStore(), { type: "start", now: start })
    const duration = store.timer.segmentMs
    store = applySession(store, { type: "pause", now: start + 5_000 })
    expect(store.timer.phase).toBe("paused")
    expect(store.timer.endsAt).toBeNull()
    expect(store.timer.remainingMs).toBe(duration - 5_000)
    store = applySession(store, { type: "start", now: start + 9_000 })
    expect(store.timer.endsAt).toBe(start + 9_000 + (duration - 5_000))
  })

  it("takes a long rest on the configured interval and resets the streak", () => {
    let store = defaultStore()
    store = { ...store, tasks: [task({ estimate: 4 })], activeId: "task-1" }
    const step = (now: number) => {
      store = applySession(store, { type: "start", now })
      store = applySession(store, { type: "complete", now: store.timer.endsAt ?? now })
    }
    step(0)
    expect(store.timer.mode).toBe("short")
    expect(store.timer.focusStreak).toBe(1)
    expect(store.tasks[0]?.doneCount).toBe(1)
    step(1)
    expect(store.timer.mode).toBe("focus")
    step(2)
    expect(store.timer.mode).toBe("short")
    expect(store.timer.focusStreak).toBe(2)
    step(3)
    step(4)
    expect(store.timer.focusStreak).toBe(3)
    step(5)
    step(6)
    expect(store.timer.mode).toBe("long")
    expect(store.timer.focusStreak).toBe(0)
    expect(store.tasks[0]?.doneCount).toBe(4)
    expect(store.log.filter((entry) => entry.mode === "focus")).toHaveLength(4)
  })

  it("does not credit a skipped focus block", () => {
    let store = defaultStore()
    store = {
      ...store,
      tasks: [task()],
      activeId: "task-1",
      timer: { ...store.timer, focusStreak: 3 },
    }
    store = applySession(store, { type: "skip", now: 10 })
    expect(store.timer.mode).toBe("short")
    expect(store.timer.focusStreak).toBe(3)
    expect(store.tasks[0]?.doneCount).toBe(0)
    expect(store.log).toHaveLength(0)
  })

  it("auto-starts a rest only when that setting is on", () => {
    const settings: Settings = { ...defaultStore().settings, autoStartBreak: true, autoStartFocus: false }
    let store = { ...defaultStore(), settings, timer: freshTimer(settings) }
    store = applySession(store, { type: "start", now: 0 })
    const end = store.timer.endsAt ?? 0
    store = applySession(store, { type: "complete", now: end })
    expect(store.timer.mode).toBe("short")
    expect(store.timer.phase).toBe("running")
    expect(store.timer.endsAt).toBe(end + settings.shortMin * minute)
    store = applySession(store, { type: "complete", now: store.timer.endsAt ?? end })
    expect(store.timer.mode).toBe("focus")
    expect(store.timer.phase).toBe("idle")
  })

  it("moves an untouched idle clock when durations change", () => {
    const prev = defaultStore().settings
    const next = { ...prev, focusMin: 50 }
    const store = applySession(defaultStore(), {
      type: "apply-settings",
      prev,
      settings: next,
      now: 0,
    })
    expect(store.timer.remainingMs).toBe(50 * minute)
    expect(store.settings.focusMin).toBe(50)
  })

  it("adds and removes a minute on a running clock", () => {
    let store = applySession(defaultStore(), { type: "start", now: 0 })
    const before = viewRemaining(store.timer, 1_000)
    store = applySession(store, { type: "nudge", deltaMs: minute, now: 1_000 })
    expect(viewRemaining(store.timer, 1_000)).toBe(before + minute)
    store = applySession(store, { type: "nudge", deltaMs: -minute, now: 1_000 })
    expect(viewRemaining(store.timer, 1_000)).toBe(before)
  })
})

describe("task counting and finish time", () => {
  it("counts a finished focus block only on the active task", () => {
    const tasks = [task({ id: "a" }), task({ id: "b", title: "Other" })]
    expect(creditActive(tasks, "b")[1]?.doneCount).toBe(1)
    expect(creditActive(tasks, "b")[0]?.doneCount).toBe(0)
    expect(creditActive(tasks, null)[0]?.doneCount).toBe(0)
    expect(openBlocks(creditActive(tasks, "a"))).toBe(1)
  })

  it("places the finish time after the remaining blocks and the rests between them", () => {
    const settings = defaultStore().settings
    const timer = freshTimer(settings)
    const now = Date.UTC(2026, 9, 30, 15, 0, 0)
    const at = finishAt(now, [task({ estimate: 2 })], "task-1", settings, timer)
    expect(at).toBe(now + 25 * minute + 5 * minute + 25 * minute)
  })

  it("uses the time left on a running focus block instead of a full one", () => {
    const settings = defaultStore().settings
    const now = 10_000
    const timer = {
      ...freshTimer(settings),
      phase: "running" as const,
      remainingMs: 25 * minute,
      endsAt: now + 10 * minute,
      segmentMs: 25 * minute,
    }
    const at = finishAt(now, [task({ estimate: 2 })], "task-1", settings, timer)
    expect(at).toBe(now + 10 * minute + 5 * minute + 25 * minute)
  })

  it("sums today's focus minutes from the log", () => {
    const now = new Date(2026, 9, 30, 16, 0, 0).getTime()
    const morning = new Date(2026, 9, 30, 9, 0, 0).getTime()
    const stats = focusStats(
      [
        { id: "1", mode: "focus", endedAt: morning, durationMs: 25 * minute, taskId: "task-1" },
        { id: "2", mode: "short", endedAt: morning + minute, durationMs: 5 * minute, taskId: null },
      ],
      now,
    )
    expect(stats.todayCount).toBe(1)
    expect(stats.todayMinutes).toBe(25)
    expect(sessionsCsv(
      [{ id: "1", mode: "focus", endedAt: morning, durationMs: 25 * minute, taskId: "task-1" }],
      [task()],
    )).toContain("Draft notes")
  })
})
