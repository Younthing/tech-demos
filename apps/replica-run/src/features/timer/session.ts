import { reduceTimer } from "./reducer.ts"
import { creditActive, placeFinished } from "../tasks/model.ts"
import {
  defaultSettings,
  freshTimer,
  makeId,
  type Store,
  type TimerEvent,
} from "./types.ts"

export function defaultStore(): Store {
  const settings = defaultSettings()
  return {
    settings,
    tasks: [],
    activeId: null,
    timer: freshTimer(settings),
    log: [],
    templates: [],
    finishSeq: 0,
    lastFinished: null,
  }
}

export function applySession(store: Store, event: TimerEvent): Store {
  const settings = event.type === "apply-settings" ? event.settings : store.settings
  const transition = reduceTimer(store.timer, event, settings)
  const credited = transition.creditedFocus
    ? creditActive(store.tasks, store.activeId, settings.autoCheck)
    : store.tasks
  const tasks = placeFinished(credited, settings.checkToBottom)
  if (!transition.finished) {
    return { ...store, settings, tasks, timer: transition.state }
  }
  return {
    ...store,
    settings,
    tasks,
    timer: transition.state,
    finishSeq: store.finishSeq + 1,
    lastFinished: transition.finished,
    log: [
      ...store.log,
      {
        id: makeId(),
        mode: transition.finished.mode,
        endedAt: event.now,
        durationMs: transition.finished.durationMs,
        taskId: store.activeId,
      },
    ],
  }
}
