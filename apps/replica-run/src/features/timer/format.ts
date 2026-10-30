import type { Mode } from "./types.ts"

export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function modeLabel(mode: Mode): string {
  if (mode === "focus") return "Focus"
  if (mode === "short") return "Short rest"
  return "Long rest"
}

export function formatFinish(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}
