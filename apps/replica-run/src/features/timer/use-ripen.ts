import { useCallback, useEffect, useRef, useState } from "react"
import { finishAt } from "./finish.ts"
import { applySession } from "./session.ts"
import { playChime, setHush, unlockSound } from "./sound.ts"
import { loadStore, saveStore } from "./storage.ts"
import { viewRemaining, type Finished, type Store, type TimerEvent } from "./types.ts"

function isField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A") {
    return true
  }
  return target.isContentEditable || Boolean(target.closest("summary, a, button, input, textarea, select"))
}

function notifyFinished(finished: Finished): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  const body =
    finished.mode === "focus"
      ? "Focus block ended. Step away before the next one."
      : finished.mode === "short"
        ? "Short rest ended. Begin the next block when you mean it."
        : "Long rest ended. The next focus block can start when you do."
  try {
    new Notification("Ripen", { body })
  } catch {
    /* the browser refused the notice */
  }
}

export function useRipen() {
  const [store, setStore] = useState<Store>(() => loadStore())
  const [now, setNow] = useState(() => Date.now())
  const [storageError, setStorageError] = useState(false)
  const storeRef = useRef(store)
  const seenFinish = useRef(0)

  const update = useCallback((recipe: (prev: Store) => Store) => {
    setStore((prev) => {
      const next = recipe(prev)
      storeRef.current = next
      return next
    })
  }, [])

  const dispatch = useCallback(
    (event: TimerEvent) => {
      update((prev) => applySession(prev, event))
    },
    [update],
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      const tick = Date.now()
      setNow(tick)
      const current = storeRef.current
      if (current.timer.phase === "running" && viewRemaining(current.timer, tick) <= 0) {
        dispatch({ type: "complete", now: tick })
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [dispatch])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return
      const tick = Date.now()
      setNow(tick)
      const current = storeRef.current
      if (current.timer.phase === "running" && viewRemaining(current.timer, tick) <= 0) {
        dispatch({ type: "complete", now: tick })
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [dispatch])

  useEffect(() => {
    setStorageError(!saveStore(store))
  }, [store])

  useEffect(() => {
    if (store.finishSeq === seenFinish.current) return
    seenFinish.current = store.finishSeq
    if (!store.lastFinished) return
    if (store.settings.sound) playChime(store.settings.volume)
    if (store.settings.notify) notifyFinished(store.lastFinished)
  }, [store.finishSeq, store.lastFinished, store.settings])

  useEffect(() => {
    const on =
      store.settings.hush && store.timer.mode === "focus" && store.timer.phase === "running"
    setHush(on, store.settings.volume)
    return () => setHush(false, 0)
  }, [store.settings.hush, store.settings.volume, store.timer.mode, store.timer.phase])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return
      if (isField(event.target)) return
      event.preventDefault()
      unlockSound()
      dispatch({ type: "toggle", now: Date.now() })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dispatch])

  useEffect(() => {
    const clock = formatTab(viewRemaining(store.timer, now))
    const label =
      store.timer.mode === "focus" ? "Focus" : store.timer.mode === "short" ? "Short rest" : "Long rest"
    document.title =
      store.timer.phase === "paused"
        ? `${clock} paused · ${label} · Ripen`
        : `${clock} · ${label} · Ripen`
  }, [store.timer, now])

  const remaining = viewRemaining(store.timer, now)
  const finish = finishAt(now, store.tasks, store.activeId, store.settings, store.timer)

  return { store, now, remaining, finish, storageError, dispatch, update, unlockSound }
}

function formatTab(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}
