## Parity: 75.2 / 100

features 87.5  (33 counted, must-haves 10 of 10 done)
layout   26.2  (3 screens compared)

## By area, weakest first
- settings                      59.1  (13 features)
- timer                        100.0  (7 features)
- tasks                        100.0  (11 features)
- report                       100.0  (1 features)
- storage                      100.0  (1 features)

## Missing, in build order
- [should] settings: Pick from several alarm sounds and a repeat count, no  (Ripen has one synthesised chime)
- [should] settings: Warn a few minutes before a block ends, no  (The original can remind near the end)
- [should] settings: Play a background sound during focus, partial  (One synthesised noise, not a library of scenes)
- [could] settings: Choose a 24-hour clock, no  (Finish times use the browser locale)
- [could] settings: Choose a colour theme, no  (Modes have fixed colours)
- [could] settings: Open a small always-on-top window, no  (Not in this page)
- [could] settings: Put the session in a separate dark theme, no  (Each mode already uses its own dark field)

## Left out on purpose (not scored)
- Installable desktop builds: Their installers are outside this local web demo
- Account and sync across devices: No server in this demo
- Projects with separate totals: Paid tier on the original
- Yearly report: Paid tier on the original
- CSV export of history as a paid feature: Paid tier on the original; a local export is tracked separately
- Unlimited templates: Paid tier on the original
- Import tasks from a third-party app: Requires their partner connection
- Outbound webhooks: Paid integration
- Remove ads by paying: Paid tier; this demo records the ad-free session separately

## Yours, not in the original (not scored)
- Add or subtract a minute on the live clock
- Download the session log from this browser
- Keep one browser store, with no second account to diverge from

## Screens
- replica/clone-screens/S01-mobile.png      13.0
- replica/clone-screens/S04-desktop.png     20.5
- replica/clone-screens/S01-desktop.png     45.2


## Behaviour

Written after using both apps. Not scored by parity.py.

- F01. The public timer puts one wide control under the digits, and the idle tab title already includes the clock. Ripen does the same job with its own label, and stores the end as a timestamp. Space was not confirmed on the original.
- F02. The public composer has a stepper, a note, and a locked project control. Ripen asks for a title and a number of blocks.
- F03. Shared defaults: 25, 5, 15, interval 4, auto-start off. Ripen does not ship the alarm catalogue, the reminder-before-end, the theme picker, or integrations.
- F04. No add-or-drop-a-minute control was visible on the public timer or in the settings text that was read. Ripen puts those in the More menu.
- F05. The public timer has sign-in. Ripen does not.
