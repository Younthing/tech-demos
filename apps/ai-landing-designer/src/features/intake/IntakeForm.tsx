import type { Intake, PrimaryAction, Traffic } from '@/engine/generate'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ACTIONS: { v: PrimaryAction; label: string }[] = [
  { v: 'trial', label: 'Free trial' },
  { v: 'demo', label: 'Book a demo' },
  { v: 'waitlist', label: 'Waitlist' },
  { v: 'buy', label: 'Buy' },
  { v: 'download', label: 'Download' },
]
const TRAFFIC: { v: Traffic; label: string }[] = [
  { v: 'search', label: 'Search' },
  { v: 'ads', label: 'Ads' },
  { v: 'social', label: 'Social' },
  { v: 'email', label: 'Email' },
]

type TextKey = Exclude<keyof Intake, 'action' | 'traffic'>
const FIELDS: { key: TextKey; label: string; hint: string; area?: boolean; required?: boolean }[] = [
  { key: 'productName', label: 'Product name', hint: 'Ledgerline', required: true },
  { key: 'oneLiner', label: 'One liner', hint: 'What it is, in one sentence', area: true, required: true },
  { key: 'category', label: 'Category', hint: 'bookkeeping app' },
  { key: 'audience', label: 'Audience (ICP)', hint: 'freelance designers', required: true },
  { key: 'pain', label: 'Main pain today', hint: 'chasing receipts every month' },
  { key: 'outcome', label: 'Outcome they get', hint: 'tax ready books' },
  { key: 'timeToValue', label: 'Time it takes', hint: '10 minutes a week' },
  { key: 'riskReversal', label: 'Risk reversal', hint: '14 day free trial, no credit card' },
]

export function IntakeForm({ value, onChange }: { value: Intake; onChange: (v: Intake) => void }) {
  const set = <K extends keyof Intake>(k: K, v: Intake[K]) => onChange({ ...value, [k]: v })
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()} aria-label="Intake">
      {FIELDS.map((f) => {
        const missing = f.required && !value[f.key].trim()
        const id = `f-${f.key}`
        const Comp = f.area ? Textarea : Input
        return (
          <div key={f.key} className="flex flex-col gap-2">
            <Label htmlFor={id}>
              {f.label}
              {f.required && <span className="text-muted-foreground">*</span>}
            </Label>
            <Comp
              id={id}
              value={value[f.key]}
              placeholder={f.hint}
              aria-invalid={missing || undefined}
              onChange={(e) => set(f.key, e.target.value)}
              className={f.area ? 'min-h-20' : undefined}
            />
            {missing && <p className="text-xs text-destructive">Required. The generator will assume a default until you fill it in.</p>}
          </div>
        )
      })}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Primary action</Label>
          <Select value={value.action} onValueChange={(v) => set('action', v as PrimaryAction)}>
            <SelectTrigger className="w-full" aria-label="Primary action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a.v} value={a.v}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Traffic source</Label>
          <Select value={value.traffic} onValueChange={(v) => set('traffic', v as Traffic)}>
            <SelectTrigger className="w-full" aria-label="Traffic source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRAFFIC.map((a) => (
                <SelectItem key={a.v} value={a.v}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </form>
  )
}
