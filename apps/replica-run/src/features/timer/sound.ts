let audio: AudioContext | null = null
let hushStop: (() => void) | null = null

function context(): AudioContext | null {
  const Ctx = window.AudioContext
  if (!Ctx) return null
  if (!audio) audio = new Ctx()
  return audio
}

export function unlockSound(): void {
  const ctx = context()
  if (ctx && ctx.state === "suspended") void ctx.resume()
}

/** Two rising sine tones. Generated here, not loaded from a file. */
export function playChime(volume: number): void {
  const ctx = context()
  if (!ctx) return
  const level = Math.min(1, Math.max(0, volume))
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99]
  for (let i = 0; i < notes.length; i += 1) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = notes[i] ?? 523.25
    const start = now + i * 0.11
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * 0.18), start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.4)
  }
}

/** Quiet filtered noise for focus. Generated here, not a recorded loop. */
export function setHush(on: boolean, volume: number): void {
  if (!on) {
    hushStop?.()
    hushStop = null
    return
  }
  if (hushStop) return
  const ctx = context()
  if (!ctx) return
  const length = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = 700
  const gain = ctx.createGain()
  gain.gain.value = Math.min(0.06, Math.max(0, volume) * 0.04)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
  hushStop = () => {
    try {
      source.stop()
    } catch {
      /* already stopped */
    }
    source.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
}
