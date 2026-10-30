import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  clampEvery,
  clampMinutes,
  type Settings,
} from "./types.ts"

type Props = {
  open: boolean
  settings: Settings
  onOpenChange: (open: boolean) => void
  onSave: (next: Settings, prev: Settings) => void
}

export function SettingsDialog({ open, settings, onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(settings)
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session settings</DialogTitle>
          <DialogDescription>
            Lengths apply to the next full interval. A clock already in progress keeps its end time.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              id="focus-min"
              label="Focus minutes"
              value={draft.focusMin}
              onChange={(focusMin) => setDraft({ ...draft, focusMin })}
            />
            <NumberField
              id="short-min"
              label="Short rest minutes"
              value={draft.shortMin}
              onChange={(shortMin) => setDraft({ ...draft, shortMin })}
            />
            <NumberField
              id="long-min"
              label="Long rest minutes"
              value={draft.longMin}
              onChange={(longMin) => setDraft({ ...draft, longMin })}
            />
          </div>
          <NumberField
            id="long-every"
            label="Focus blocks before a long rest"
            value={draft.longEvery}
            min={1}
            max={12}
            onChange={(longEvery) => setDraft({ ...draft, longEvery: clampEvery(longEvery) })}
          />
          <Toggle
            id="auto-break"
            label="Start rests on their own"
            checked={draft.autoStartBreak}
            onChange={(autoStartBreak) => setDraft({ ...draft, autoStartBreak })}
          />
          <Toggle
            id="auto-focus"
            label="Start the next focus on its own"
            checked={draft.autoStartFocus}
            onChange={(autoStartFocus) => setDraft({ ...draft, autoStartFocus })}
          />
          <Toggle
            id="auto-check"
            label="Mark a task finished when its estimate is met"
            checked={draft.autoCheck}
            onChange={(autoCheck) => setDraft({ ...draft, autoCheck })}
          />
          <Toggle
            id="check-bottom"
            label="Move finished tasks to the bottom"
            checked={draft.checkToBottom}
            onChange={(checkToBottom) => setDraft({ ...draft, checkToBottom })}
          />
          <Toggle
            id="chime"
            label="Chime at the end"
            checked={draft.sound}
            onChange={(sound) => setDraft({ ...draft, sound })}
          />
          <Toggle
            id="hush"
            label="Soft noise during focus"
            checked={draft.hush}
            onChange={(hush) => setDraft({ ...draft, hush })}
          />
          <Toggle
            id="notify"
            label="Desktop notice"
            checked={draft.notify}
            onChange={(notify) => {
              setDraft({ ...draft, notify })
              if (notify && typeof Notification !== "undefined" && Notification.permission === "default") {
                void Notification.requestPermission()
              }
            }}
          />
          <div className="grid gap-2">
            <Label htmlFor="volume">Chime volume</Label>
            <input
              id="volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.volume}
              onChange={(event) => setDraft({ ...draft, volume: Number(event.target.value) })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => {
              const next: Settings = {
                ...draft,
                focusMin: clampMinutes(draft.focusMin),
                shortMin: clampMinutes(draft.shortMin),
                longMin: clampMinutes(draft.longMin),
                longEvery: clampEvery(draft.longEvery),
              }
              onSave(next, settings)
              onOpenChange(false)
            }}
          >
            Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 1,
  max = 180,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
