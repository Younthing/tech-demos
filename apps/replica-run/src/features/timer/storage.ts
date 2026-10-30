import { defaultStore } from "./session.ts"
import {
  clampEstimate,
  clampEvery,
  clampMinutes,
  freshTimer,
  type LogEntry,
  type Mode,
  type Settings,
  type Store,
  type Task,
  type Template,
  type TimerState,
} from "./types.ts"

const KEY = "ripen.v1"

type Saved = {
  settings: Settings
  tasks: Task[]
  activeId: string | null
  timer: TimerState
  log: LogEntry[]
  templates: Template[]
}

function isMode(value: unknown): value is Mode {
  return value === "focus" || value === "short" || value === "long"
}

function settingsFrom(value: unknown): Settings {
  const base = defaultStore().settings
  if (!value || typeof value !== "object") return base
  const raw = value as Partial<Settings>
  return {
    focusMin: clampMinutes(Number(raw.focusMin ?? base.focusMin)),
    shortMin: clampMinutes(Number(raw.shortMin ?? base.shortMin)),
    longMin: clampMinutes(Number(raw.longMin ?? base.longMin)),
    longEvery: clampEvery(Number(raw.longEvery ?? base.longEvery)),
    autoStartBreak: Boolean(raw.autoStartBreak),
    autoStartFocus: Boolean(raw.autoStartFocus),
    sound: raw.sound !== false,
    notify: Boolean(raw.notify),
    volume: Math.min(1, Math.max(0, Number(raw.volume ?? base.volume))),
    hush: Boolean(raw.hush),
    autoCheck: Boolean(raw.autoCheck),
    checkToBottom: raw.checkToBottom !== false,
  }
}

function taskFrom(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Partial<Task>
  if (typeof raw.id !== "string" || typeof raw.title !== "string") return null
  return {
    id: raw.id,
    title: raw.title.slice(0, 180),
    estimate: clampEstimate(Number(raw.estimate ?? 1)),
    doneCount: Math.max(0, Math.round(Number(raw.doneCount ?? 0))),
    done: Boolean(raw.done),
    createdAt: Number(raw.createdAt ?? Date.now()),
  }
}

function timerFrom(value: unknown, settings: Settings): TimerState {
  const fresh = freshTimer(settings)
  if (!value || typeof value !== "object") return fresh
  const raw = value as Partial<TimerState>
  if (!isMode(raw.mode)) return fresh
  const phase = raw.phase === "running" || raw.phase === "paused" ? raw.phase : "idle"
  const remainingMs = Math.max(0, Number(raw.remainingMs ?? fresh.remainingMs))
  return {
    mode: raw.mode,
    phase,
    remainingMs,
    endsAt: phase === "running" ? Number(raw.endsAt ?? Date.now() + remainingMs) : null,
    focusStreak: Math.max(0, Math.round(Number(raw.focusStreak ?? 0))),
    segmentMs: Math.max(0, Number(raw.segmentMs ?? remainingMs)),
  }
}

export function loadStore(): Store {
  try {
    const text = localStorage.getItem(KEY)
    if (!text) return defaultStore()
    const parsed = JSON.parse(text) as Partial<Saved>
    const settings = settingsFrom(parsed.settings)
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks.map(taskFrom).filter((task): task is Task => task !== null)
      : []
    const activeId =
      typeof parsed.activeId === "string" && tasks.some((task) => task.id === parsed.activeId)
        ? parsed.activeId
        : null
    const log = Array.isArray(parsed.log)
      ? parsed.log.filter(
          (entry): entry is LogEntry =>
            !!entry &&
            typeof entry === "object" &&
            typeof (entry as LogEntry).id === "string" &&
            isMode((entry as LogEntry).mode),
        )
      : []
    const templates = Array.isArray(parsed.templates)
      ? parsed.templates.filter(
          (item): item is Template =>
            !!item &&
            typeof item === "object" &&
            typeof (item as Template).id === "string" &&
            typeof (item as Template).name === "string" &&
            Array.isArray((item as Template).items),
        )
      : []
    return {
      settings,
      tasks,
      activeId,
      timer: timerFrom(parsed.timer, settings),
      log,
      templates,
      finishSeq: 0,
      lastFinished: null,
    }
  } catch {
    return defaultStore()
  }
}

export function saveStore(store: Store): boolean {
  const saved: Saved = {
    settings: store.settings,
    tasks: store.tasks,
    activeId: store.activeId,
    timer: store.timer,
    log: store.log,
    templates: store.templates,
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
    return true
  } catch {
    return false
  }
}
