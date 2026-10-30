# Ripen

Ripen is a local focus timer: three intervals, a task queue with estimates, a finish time, and a short report. It is a clean-room study of the public timer at pomofocus.io, built by following [replica-skill](https://github.com/Jakeschincariol/replica-skill) (Jake Schincariol, MIT). Ripen is not affiliated with that site, and it does not use its name, colours, logo, copy, or sounds.

The study pages are part of the same app:

- `/` the timer
- `/diff` feature and layout scores from the vendored tools
- `/fixes` public comments, kept verbatim, and the fix plan
- `/about` which pipeline steps ran, and which were skipped (backend, launch, deploy)

## Run

```bash
cd apps/replica-run
bun install
bun run dev
```

`bunfig.toml` sets `minimumReleaseAge` before install. Tests:

```bash
bun run test
bun run test:e2e
```

The Python tools under `vendor/replica-skill/` are standard-library only and are used while authoring, not by the running page. `bun run replica:diff` refreshes `replica/parity.json` from the screenshots already in the repo.

## Credit

Pipeline and scoring tools: replica-skill by Jake Schincariol, MIT, commit `77c9436fb3d18c3d58169efb8caf4fe906b0dc51`.
Subject of the study: Pomofocus (pomofocus.io). Ripen is an independent rebuild.
