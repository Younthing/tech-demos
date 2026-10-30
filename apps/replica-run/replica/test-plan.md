# Test plan: Ripen

Build: local  Date: 2026-10-30  Env: local, empty storage

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | run a focus block | happy | set focus to 1 minute, turn on auto-start rests, add a task, Begin, advance 60s | short rest selected, task shows 1/1, report says 1 block | e2e | pass |
| F01-E1 | timestamp | edge | start at T, read remaining at T+10s with no tick action | remaining is duration minus 10s | unit | pass |
| F01-E2 | long rest interval | edge | complete 4 focus blocks with interval 4 | the fourth completion opens a long rest and clears the streak | unit | pass |
| F01-E3 | skip | edge | skip a focus block | no credit, streak unchanged | unit | pass |
| F01-E4 | nudge | edge | add and drop a minute while running | remaining moves by 60s and comes back | unit | pass |
| F02-H1 | add a task | happy | New task, title, Add to queue | row visible, title under the digits | e2e | pass |
| F02-E1 | empty title | edge | submit blank | no row added | unit | pass |
| F02-E2 | finish time | edge | one task, estimate 2, idle | finish is two focus blocks plus one short rest | unit | pass |
| F03-H1 | settings | happy | change an idle focus length from 25 to 50 | the idle clock shows 50:00 | unit | pass |
| F04-H1 | report | happy | one finished focus block today | today count 1 and 25 minutes | unit | pass |

Negative cases that need an account or a payment are out of scope. Keyboard-only is the Space shortcut plus normal tab order. Mobile width is checked by the 390×844 screenshot, not by a second e2e.
