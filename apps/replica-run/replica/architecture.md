# Architecture: Ripen (a rebuild of the public timer's core features)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Vite, React, TypeScript | A client-only demo. No server to justify a heavier framework. |
| styling | Tailwind v4 and shadcn/ui, tokens in `replica/design` | Repo default. Components are added as they are used. |
| routing | react-router | Four routes: the timer and three study pages. |
| database | none | The backend step is skipped. State is `localStorage` key `ripen.v1`. |
| auth | none | No account, on purpose. |
| payments | none | Out of scope. |
| email | none | The notice is the browser Notification API. |
| jobs | a 200ms render tick in the page | The clock itself is an end timestamp, not the tick. |
| hosting | local `bun run dev` | Deploy is skipped. |

## Schema

No SQL. Access rule: this browser only.

```
settings: focusMin, shortMin, longMin, longEvery,
          autoStartBreak, autoStartFocus, autoCheck, checkToBottom,
          sound, notify, volume, hush
tasks: id, title, estimate, doneCount, done, createdAt
templates: id, name, items[{title, estimate}]   cap 3
timer: mode, phase, remainingMs, endsAt, focusStreak, segmentMs
log: id, mode, endedAt, durationMs, taskId
activeId
```

`endsAt` is epoch milliseconds. While `phase` is `running`, time left is `endsAt - Date.now()`. A hidden tab does not need to tick for that subtraction to stay right. When the page notices the end has passed, it completes that one block. It does not invent the blocks that might have auto-started while the tab was closed.

## API

No routes on a server. In the page:

| call | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `applySession` | start, pause, skip, complete, nudge, change mode, apply settings | this page | a timer event | next store | F01–F03 |
| `finishAt` | estimate the wall time the open blocks would end | this page | tasks, settings, timer, now | timestamp or null | F02 |
| `focusStats` | today, 7 days, 30 days | this page | log, now | counts and minutes | F04 |
| `sessionsCsv` | the log as text | this page | log, tasks | csv | F04 |

Webhooks: none. Jobs: none.

## The parts that bite

- Time zones: the report buckets sessions by local midnight. The stored instant is UTC epoch ms.
- A background tab: completion is detected from `endsAt`, including on `visibilitychange`.
- Double complete: `complete` does nothing unless the phase is `running`, and the ref is updated inside the state change so the next tick sees it.
- Storage quota: a failed write shows a short alert. The session keeps running.
- Notifications need a gesture and permission. The chime uses a synthesised AudioContext unlocked by Begin.

## Build order

1. Vertical slice: S01 timer, modes, start, pause, one task.
2. Must-haves: estimates, active task, finished flag, fraction.
3. Should-haves: settings, sound, notice, report, templates, tab title, keyboard.
4. Fixes: minute nudge, local csv, no account. Extension and calendar layout stay unbuilt.
