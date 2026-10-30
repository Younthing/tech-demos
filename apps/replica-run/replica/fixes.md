# Complaints, fix plan, and angle

Sample: **18 reviews** from **2 sources** (Hacker News and the Product Hunt product page). **0** had star ratings. Every theme below is **thin** (under 3 reviews, or only one source). This is not a ranking. It is a small public sample.

Reddit was opened in a browser and returned a network-security block, so no Reddit text is included. No Reddit API credentials were available, so the official API was not queried. App Store and Play have no listing to read. Nothing below was paraphrased.

Product Hunt dates are the page's relative stamps, read on 2026-10-30: "7yr ago" is stored as 2019-10 and "5yr ago" as 2021-10. The day is unknown. Rows with a blank date had no stamp, so the ranker did not age them.

## What they hate

All thin.

1. **A chime is easy to miss, and sound is part of why people stay.** 2 reviews, 2 sources. One is a request for a notice, one is praise.
   - "So the chime could be easily missed." [Product Hunt](https://www.producthunt.com/products/pomofocus)
   - "https://pomofocus.io/app is similar (but with satisfying sounds!)" [Hacker News](https://news.ycombinator.com/item?id=35475061)

2. **Work and break lengths feel rigid once a block has started.** 1 review, 1 source.
   - "you can't add or subtract time" inside the comment at [Hacker News](https://news.ycombinator.com/item?id=34482019)

3. **Signing in did not show the tasks or the report from the logged-out session.** 1 review, 1 source.
   - "It said to login to see reports. Logged in. Now all my tasks were gone and no data." [Product Hunt](https://www.producthunt.com/products/pomofocus)

Hand-read false hits, not used as evidence:

- "Privacy" matched the word "tracking" inside "tracking and reporting".
- "Billing" matched "billing by the hour" in a sentence about invoicing clients.
- "Slow" matched "Loading Focal...", which is about a different app in that comment.

## What is missing

All thin.

1. **A browser extension, or a way to run the timer without a full tab.** 3 reviews, 1 source.
   - "Is there a plan to release it as a browser extension?" [Product Hunt](https://www.producthunt.com/products/pomofocus)
   - "You should consider making this into a Chrome/Firefox plugin." [Product Hunt](https://www.producthunt.com/products/pomofocus)
   - "It would be nice to start and stop from the browser instead of keeping the website running on a separate tab." [Product Hunt](https://www.producthunt.com/products/pomofocus)

2. **Export of times, including for client billing.** 1 review, 1 source. The same comment as the rigid-interval note.
   - "you can't export the times as a PDF or CSV" [Hacker News](https://news.ycombinator.com/item?id=34482019)

3. **A notice when the block hits zero**, for people who will not hear the chime. 1 review, 1 source, from 2019. The current settings text on the public site includes a notification section, so this is not treated as an open gap.

## What is unsolved

1. **People who want the timer outside a normal tab.** The extension comments are one source and still thin, but they describe a job this page does not do.
2. **People who do not want an account that can disagree with the browser.** One report of tasks vanishing after sign-in. Thin, and specific.

## Fix plan

| # | Change | Size | Status in Ripen | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Add or drop a minute on the live clock | S | Shipped, from the More menu | HN 34482019, thin, 1 review |
| 2 | Download the session log from this browser | S | Shipped, from the report | HN 34482019, thin, 1 review |
| 3 | One browser store and no second account | S | Shipped, there is no sign-in | Product Hunt, Jennifer Jackson, thin, 1 review |
| 4 | Browser extension or a pin-able control | M | Not built. Out of scope for this page | Product Hunt, thin, 3 reviews, 1 source |
| 5 | Calendar layout for tasks | L | Not built | Same HN comment, thin |
| 6 | Auto-start the rest, and wait for a click before the next focus | S | Already a setting on the original by 2023, and a setting here. Not a new gap | HN 24977005 and 34479634 |
| 7 | Desktop notice when a block ends | S | Shipped as parity. The 2019 request is not claimed as an open hole | Product Hunt, 2019-10 |
| 8 | Several alarm sounds and a repeat count | S | Not built. One synthesised chime | Observed in settings, not in this review sample |

Rows 1–3 are in `features.csv` with `original` set to `no`.

## Angles

For a person who is already in a block and does not want to open settings, Ripen adds or drops a minute from the menu.
Evidence: rigid intervals, 1 review, 1 source, thin.

For a person who lost a task list after signing in, Ripen keeps a single store in the browser and has no account to diverge from it.
Evidence: the sign-in comment, 1 review, 1 source, thin.

For a person who wants the clock in the browser chrome, an extension would start and stop without a full tab.
Evidence: extension comments, 3 reviews, 1 source, thin. Not built here.

**Recommended:** the single store. A vanished task list is a sharper failure than a missing minute button, and the sample is too small to pretend otherwise. The minute control still ships, because that comment was specific. Neither angle is a trend.
