# Anatomy Explorer

A single-user look at the [Anatomy](https://github.com/wheresryan22/anatomy) idea: a technical system drawn as a small machine you can turn and inspect.

Three figures are bundled. They are drawn with the vendored Anatomy kit (`src/vendor/anatomy`), the same isometric camera, solids, and four-tone shading the skill uses. Nothing is generated at runtime, and the page does not call Claude Code or any model API.

| Figure | What it explains |
| --- | --- |
| Token mill | An LLM pipeline: hopper, embedding drum, attention rack, feed-forward press, sampler |
| Build line | A CI pipeline: lint lamp, test jig, build press, deploy gate |
| Token bucket | A rate limiter: header tank, metering valve, token stack, turnstile |

## Run

From this folder:

```bash
bun install && bun run dev
```

Open the URL Vite prints. Drag the figure to orbit it, or use Turn left / Turn right. Click a part, or its row in the list, to read what it does. Arrow keys orbit while the figure is focused.

```bash
bun test
```

## Limits

These are hand-built examples in the kit's style, not a live `/anatomy` session. The kit's pipe, lathe, WebGL, and 3D runtimes are not included. Orbiting sorts whole assemblies by depth; a close-up can still show a front lip crossing a foot.
