# Recon map: Pomofocus (web)

Scope: the logged-out timer, task list, settings, and the simple report. Not accounts, payments, or the desktop installers.
For: one person, locally, as a clean-room study named Ripen.
Date: 2026-10-30

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | the public timer | https://pomofocus.io/ | Read in a browser. Screenshots in `replica/screens/`. |
| 2 | the same page, below the timer | https://pomofocus.io/ | Public how-to and the free/premium feature lists. |
| 3 | settings dialog | https://pomofocus.io/ | Opened from the timer. Text recorded for the feature list. |
| 4 | a product write-up | https://www.producthunt.com/products/pomofocus | Comments only, for the later review pass. |

No bundles, no private APIs, no account that is not ours.

## Core loop

Add a task, estimate how many focus blocks it needs, start the clock, take the break it offers, and see the block counted on that task.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Timer | `/` on the public site | Run a focus, short rest, or long rest | mode control, digits, primary button, caption, task heading, add control | idle empty, desktop 1440×900 and mobile 390×844 |
| S02 | Settings | button on S01 | Durations, auto-start, sounds, theme, notices | dialog, number fields, switches, selects | open, scrolled through the first sections; the lower sections were read as text |
| S03 | Task composer | add control on S01 | Name a task and set an estimate | text field, stepper, save, cancel | open, then saved |
| S04 | Timer with one task | S01 after saving "Draft notes" | Show the active task, fraction, and finish time | task row, summary line | filled, desktop 1440×900, form closed |
| S05 | Report | button on S01 | Focus history | not screenshotted; the settings text names week start and the public page names day, week, and month | not opened in this pass |

## Flows

```
F01 Run one focus block
    S01 idle -> start -> digits count down -> block ends -> short or long rest
    happy path clicks: 1 (start), then wait
    edge: leave the tab, switch mode, skip

F02 Add a task and attach the clock to it
    S01 -> S03 -> save -> S04
    happy path clicks: 3 (add, type, save)
    edge: empty title, long title, estimate of 0, several tasks, mark finished

F03 Change the rhythm
    S01 -> S02 -> edit minutes, interval, auto-start -> close
    happy path clicks: 2 plus the fields
    edge: values outside a sane range

F04 Read the day
    S01 -> report
    happy path clicks: 1
    edge: no history yet
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Mode switch | focus, short rest, long rest | selected, idle | S01, S04 |
| Digits | mm:ss | idle, running, paused | S01, S04 |
| Primary button | start, pause | default, pressed | S01, S04 |
| Task row | open, finished | active, idle | S04 |
| Add control | dashed | empty list, list with tasks | S01, S04 |
| Settings dialog | sections | open, closed | S02 |
| Summary line | fraction and finish time | hidden when the list is empty, shown when it is not | S04 |

## Inferred data model

```
Settings  focus minutes, short minutes, long minutes, long-rest interval,
          auto-start rest, auto-start focus, auto-check, move-finished-down,
          alarm, volume, repeat, focus sound, theme, hour format,
          dark-while-running, reminder minutes, week start
          evidence: S02 text and the open dialog
          confidence: high for the fields that were visible, medium for ones only named in the text

Task  title, estimate, completed count, finished flag, order, optional note
      evidence: S03 and S04
      confidence: high. Note and project were visible; project was locked.

Session  mode, end time, length, task
         evidence: the report is described on the public page; the exact record was not opened
         confidence: medium

Template  a saved set of tasks, free tier capped at 3
          evidence: the public feature list and a "create" control in the page text
          confidence: medium
```

Relationships: one browser holds many tasks and many sessions. A task has many counted focus blocks. Settings are a singleton.

## Feature matrix

See `features.csv`. The clone column is filled from the build.

## Out of scope

- Accounts, sync, and the sign-in control.
- Paid projects, yearly report, paid CSV, unlimited templates, Todoist, webhooks.
- Desktop installers.
- Their name, colours, logo, copy, and sounds.

## Size

Screens 5, flows 4, entities 4. Hard parts: a clock that survives a background tab, and not copying the trade dress. Size: S.
