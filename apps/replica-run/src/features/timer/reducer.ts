import {
  freshTimer,
  modeDurationMs,
  viewRemaining,
  type Mode,
  type Settings,
  type TimerEvent,
  type TimerState,
} from "./types.ts"

export type Transition = {
  state: TimerState
  creditedFocus: boolean
  finished: { mode: Mode; durationMs: number } | null
}

const quiet = { creditedFocus: false, finished: null } as const

function nextMode(
  state: TimerState,
  settings: Settings,
  creditFocus: boolean,
): { mode: Mode; focusStreak: number } {
  if (state.mode !== "focus") {
    return { mode: "focus", focusStreak: state.focusStreak }
  }
  if (!creditFocus) {
    return { mode: "short", focusStreak: state.focusStreak }
  }
  const streak = state.focusStreak + 1
  const every = Math.max(1, settings.longEvery)
  if (streak >= every) return { mode: "long", focusStreak: 0 }
  return { mode: "short", focusStreak: streak }
}

function arm(
  mode: Mode,
  focusStreak: number,
  settings: Settings,
  now: number,
  auto: boolean,
): TimerState {
  const remainingMs = modeDurationMs(settings, mode)
  if (!auto) {
    return { mode, phase: "idle", remainingMs, endsAt: null, focusStreak, segmentMs: remainingMs }
  }
  return {
    mode,
    phase: "running",
    remainingMs,
    endsAt: now + remainingMs,
    focusStreak,
    segmentMs: remainingMs,
  }
}

export function reduceTimer(state: TimerState, event: TimerEvent, settings: Settings): Transition {
  switch (event.type) {
    case "start": {
      if (state.phase === "running") return { state, ...quiet }
      const remainingMs =
        state.remainingMs > 0 ? state.remainingMs : modeDurationMs(settings, state.mode)
      return {
        state: {
          ...state,
          phase: "running",
          remainingMs,
          endsAt: event.now + remainingMs,
          segmentMs: state.segmentMs > 0 ? state.segmentMs : remainingMs,
        },
        ...quiet,
      }
    }
    case "pause": {
      if (state.phase !== "running" || state.endsAt == null) return { state, ...quiet }
      return {
        state: {
          ...state,
          phase: "paused",
          remainingMs: Math.max(0, state.endsAt - event.now),
          endsAt: null,
        },
        ...quiet,
      }
    }
    case "toggle":
      return state.phase === "running"
        ? reduceTimer(state, { type: "pause", now: event.now }, settings)
        : reduceTimer(state, { type: "start", now: event.now }, settings)
    case "complete": {
      if (state.phase !== "running") return { state, ...quiet }
      const credit = state.mode === "focus"
      const next = nextMode(state, settings, credit)
      const auto = next.mode === "focus" ? settings.autoStartFocus : settings.autoStartBreak
      return {
        state: arm(next.mode, next.focusStreak, settings, event.now, auto),
        creditedFocus: credit,
        finished: { mode: state.mode, durationMs: state.segmentMs },
      }
    }
    case "skip": {
      const next = nextMode(state, settings, false)
      return {
        state: arm(next.mode, next.focusStreak, settings, event.now, false),
        creditedFocus: false,
        finished: null,
      }
    }
    case "set-mode": {
      if (event.mode === state.mode && state.phase === "idle") return { state, ...quiet }
      const remainingMs = modeDurationMs(settings, event.mode)
      return {
        state: {
          mode: event.mode,
          phase: "idle",
          remainingMs,
          endsAt: null,
          focusStreak: state.focusStreak,
          segmentMs: remainingMs,
        },
        ...quiet,
      }
    }
    case "nudge": {
      const before = viewRemaining(state, event.now)
      const nextRem = Math.max(0, Math.min(180 * 60_000, before + event.deltaMs))
      const applied = nextRem - before
      const segmentMs = Math.max(0, state.segmentMs + applied)
      if (state.phase === "running") {
        return {
          state: { ...state, remainingMs: nextRem, endsAt: event.now + nextRem, segmentMs },
          ...quiet,
        }
      }
      return { state: { ...state, remainingMs: nextRem, endsAt: null, segmentMs }, ...quiet }
    }
    case "apply-settings": {
      const idleFull =
        state.phase === "idle" && state.remainingMs === modeDurationMs(event.prev, state.mode)
      if (!idleFull) return { state, ...quiet }
      const remainingMs = modeDurationMs(settings, state.mode)
      return { state: { ...state, remainingMs, segmentMs: remainingMs }, ...quiet }
    }
    default:
      return { state, ...quiet }
  }
}

export function freshFrom(settings: Settings): TimerState {
  return freshTimer(settings)
}
