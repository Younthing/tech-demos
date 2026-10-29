import { describe, expect, test } from 'bun:test'
import { SAMPLE_INTAKE, cleanCopy, generate } from './generate'
import { runChecklist } from './checklist'
import { nestedRadius } from './rules'
import type { ToneId } from './presets'

describe('generate', () => {
  for (const tone of ['editorial', 'dark', 'warm'] as ToneId[]) {
    test(`${tone}: passes the skill checklist`, () => {
      const spec = generate(SAMPLE_INTAKE, tone)
      const failed = runChecklist(spec).filter((c) => !c.pass)
      expect(failed).toEqual([])
    })
  }

  test('is deterministic for the same seed and changes with a new seed', () => {
    const a = generate(SAMPLE_INTAKE, 'editorial', 0)
    const b = generate(SAMPLE_INTAKE, 'editorial', 0)
    const c = generate(SAMPLE_INTAKE, 'editorial', 1)
    expect(a).toEqual(b)
    expect(JSON.stringify(a.testimonials)).not.toEqual(JSON.stringify(c.testimonials))
  })

  test('waitlist picks minimal layout C', () => {
    expect(generate({ ...SAMPLE_INTAKE, action: 'waitlist' }, 'dark').layout.type).toBe('C')
  })

  test('ads traffic is noindex', () => {
    expect(generate({ ...SAMPLE_INTAKE, traffic: 'ads' }, 'dark').seo.index).toBe(false)
  })

  test('hyphens and filler are scrubbed from user input', () => {
    const spec = generate({ ...SAMPLE_INTAKE, outcome: 'audit-ready books', oneLiner: 'We supercharge self-serve bookkeeping' }, 'editorial')
    expect(runChecklist(spec).filter((c) => !c.pass)).toEqual([])
  })
})

test('cleanCopy', () => {
  expect(cleanCopy('self-serve tool - fast')).toBe('self serve tool, fast')
})

test('nestedRadius', () => {
  expect(nestedRadius(16, 8)).toBe(8)
  expect(nestedRadius(8, 6)).toBe(null)
  expect(nestedRadius(24, 40)).toBe(null)
})
