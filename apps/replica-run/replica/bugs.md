# Bugs

### BUG-001: the timer page had no main landmark

- Severity: S4
- Flow / case: F01 / axe on `/`
- Screen: S01
- Build: this demo's first commit  Browser / device: Chrome, Playwright

Steps
1. Open `/`.
2. Run axe.

Expected: no violations.
Actual: missing `main`, so the heading and the timer were outside a landmark.
Evidence: first e2e run, rule `landmark-one-main`.
Status: fixed in this build by wrapping the column in `main`. The passing e2e expects zero axe violations.

No open S1, S2, S3, or S4.

## To check

- Space on the original timer was not observed. The debugger hung on a synthetic key press, so that comparison is unconfirmed.
- Whether the original drifts in a background tab was not measured. Ripen's clock uses an end timestamp either way.
