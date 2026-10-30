export const MODES = ["focus", "short", "long"] as const

export type Mode = (typeof MODES)[number]

export type Phase = "idle" | "running" | "paused"

export type Settings = {
  focusMin: number
  shortMin: number
  longMin: number
  longEvery: number
  autoStartBreak: boolean
  autoStartFocus: boolean
  sound: boolean
  notify: boolean
  volume: number
  hush: boolean
  autoCheck: boolean
  checkToBottom: boolean
}

export type TimerState = {
  mode: Mode
  phase: Phase
  remainingMs: number
  endsAt: number | null
  /** Completed focus blocks since the last long rest. */
  focusStreak: number
  /** Clock time credited if this interval runs out. */
  segmentMs: number
}

export type Task = {
  id: string
  title: string
  estimate: number
  doneCount: number
  done: boolean
  createdAt: number
}

export type Template = {
  id: string
  name: string
  items: { title: string; estimate: number }[]
}

export type LogEntry = {
  id: string
  mode: Mode
  endedAt: number
  durationMs: number
  taskId: string | null
}

export type Finished = {
  mode: Mode
  durationMs: number
}

export type Store = {
  settings: Settings
  tasks: Task[]
  activeId: string | null
  timer: TimerState
  log: LogEntry[]
  templates: Template[]
  finishSeq: number
  lastFinished: Finished | null
}

export type TimerEvent =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "toggle"; now: number }
  | { type: "skip"; now: number }
  | { type: "complete"; now: number }
  | { type: "set-mode"; mode: Mode; now: number }
  | { type: "nudge"; deltaMs: number; now: number }
  | { type: "apply-settings"; settings: Settings; prev: Settings; now: number }

export const TEMPLATE_LIMIT = 3

export function defaultSettings(): Settings {
  return {
    focusMin: 25,
    shortMin: 5,
    longMin: 15,
    longEvery: 4,
    autoStartBreak: false,
    autoStartFocus: false,
    sound: true,
    notify: false,
    volume: 0.7,
    hush: false,
    autoCheck: false,
    checkToBottom: true,
  }
}

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(180, Math.max(1, Math.round(value)))
}

export function clampEvery(value: number): number {
  if (!Number.isFinite(value)) return 4
  return Math.min(12, Math.max(1, Math.round(value)))
}

export function clampEstimate(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(20, Math.max(0, Math.round(value)))
}

export function modeDurationMs(settings: Settings, mode: Mode): number {
  const minutes =
    mode === "focus" ? settings.focusMin : mode === "short" ? settings.shortMin : settings.longMin
  return clampMinutes(minutes) * 60_000
}

export function viewRemaining(state: TimerState, now: number): number {
  if (state.phase === "running" && state.endsAt != null) {
    return Math.max(0, state.endsAt - now)
  }
  return Math.max(0, state.remainingMs)
}

export function freshTimer(settings: Settings, mode: Mode = "focus"): TimerState {
  const remainingMs = modeDurationMs(settings, mode)
  return {
    mode,
    phase: "idle",
    remainingMs,
    endsAt: null,
    focusStreak: 0,
    segmentMs: remainingMs,
  }
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
}
