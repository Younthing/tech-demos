import type { Projection } from "../vendor/anatomy/iso-kit.ts";
import { bedplate, bounds, disc, faceRing, gauge, knob, part, post, screws, slab, stack } from "./furniture.ts";
import type { Machine } from "./types.ts";

const BLOCK = 8;
const PER_TURN = 20;

export const buildLine: Machine = {
  id: "build-line",
  fig: "Fig 2",
  title: "Build line",
  kind: "CI pipeline",
  summary:
    "A bench line for one commit. A lamp looks, a gauge reads an 8-unit block, a press forms the artifact, and a gate at the end is the release.",
  caption:
    "The block under the plunger is 8 units tall. One turn of the needle is 20, so the jig reads 0.40. The lit bar is the deploy gate.",
  legendLit: "Deploy gate, open for this revision",
  legendRaised: "Crate, lamp, jig, and press",
  bounds: bounds(),
  parts: (projection) => [
    part(
      "bedplate",
      "Bedplate",
      "The line is bolted to the same kind of surface plate as the mill. The ruler along the front is the only scale on the bench. The engraved plate reads LINE.",
      [-10, 0, -6],
      0,
      bedplate(projection, "LINE"),
      projection,
    ),
    conveyor(projection),
    lint(projection),
    crate(projection),
    jig(projection),
    press(projection),
    gate(projection),
  ],
};

function conveyor(projection: Projection) {
  const markup = [
    slab(projection, { x: -150, y: 17, w: 300, d: 19, r: 1 }, 0, 1.6, "lo", { steps: 2, crease: "none" }),
    slab(projection, { x: -154, y: 12, w: 308, d: 4.4, r: 1 }, 0, 3.1, "mid", { bevel: 0.3, steps: 2 }),
    slab(projection, { x: -154, y: 36.5, w: 308, d: 4.4, r: 1 }, 0, 3.1, "mid", { bevel: 0.3, steps: 2 }),
    slab(projection, { x: -160, y: 12, w: 6, d: 29, r: 1.2 }, 0, 8, "mid", { steps: 2 }),
    slab(projection, { x: 156, y: 12, w: 6, d: 29, r: 1.2 }, 0, 8, "mid", { steps: 2 }),
  ].join("");
  return part(
    "conveyor",
    "Conveyor",
    "Two rails and a belt. A commit rides this from the lint lamp to the deploy gate. The end stops keep a crate from leaving before the gate says so.",
    [0, 26, 2],
    30,
    markup,
    projection,
  );
}

function lint(projection: Projection) {
  const markup = stack(
    [
      { at: [-96, 10, 22], markup: post(projection, -96, 10, 2.2, 0, 42) },
      { at: [-96, 44, 22], markup: post(projection, -96, 44, 2.2, 0, 42) },
      { at: [-96, 26, 42], markup: slab(projection, { x: -106, y: 6, w: 20, d: 42, r: 2 }, 40, 5, "mid", { bevel: 0.4 }) },
      { at: [-96, 26, 30], markup: disc(projection, -96, 26, 22, 4.2, 16, "hi") },
      { at: [-96, 26, 22], markup: faceRing(projection, -96, 26, 22.2, 2.6) },
    ],
    projection,
  );
  return part(
    "lint",
    "Lint lamp",
    "A lamp housed under the arch. It looks at whatever is on the belt and does not change it. Lint is a look, not a press.",
    [-96, 26, 28],
    100,
    markup,
    projection,
  );
}

function crate(projection: Projection) {
  const body = { x: -8, y: 19, w: 30, d: 16, r: 1.6 };
  const markup = [
    slab(projection, body, 1.6, 16, "hi", { bevel: 0.45, seam: true, steps: 3 }),
    slab(projection, { x: 16, y: 24, w: 3.2, d: 6, r: 0.8 }, 10, 3.2, "mid", { steps: 2 }),
    screws(projection, [
      [-4, 22, 17.6],
      [18, 22, 17.6],
    ], 1.15),
  ].join("");
  return part(
    "crate",
    "Commit crate",
    "One revision, closed. The seam is the lid and the small clasp is the lock. This crate is the commit currently under the test jig.",
    [7, 27, 10],
    110,
    markup,
    projection,
  );
}

function jig(projection: Projection) {
  const markup = [
    post(projection, 18, -18, 2.5, 0, 36),
    slab(projection, { x: 14, y: -18, w: 8, d: 48, r: 2 }, 32, 4, "mid", { bevel: 0.35 }),
    gauge(projection, 18, 22, 36, 10, BLOCK / PER_TURN),
    disc(projection, 18, 22, 18, 1.35, 18, "hi"),
    knob(projection, 30, -12, 8, 2.5, 5),
  ].join("");
  return part(
    "jig",
    "Test jig",
    "The plunger rests 8 units up, on the block that stands for this crate's suite. One needle turn is 20 units, so the dial reads 0.40.",
    [18, 8, 28],
    100,
    markup,
    projection,
  );
}

function press(projection: Projection) {
  const markup = stack(
    [
      { at: [78, 8, 24], markup: post(projection, 78, 8, 2.2, 0, 46) },
      { at: [112, 8, 24], markup: post(projection, 112, 8, 2.2, 0, 46) },
      { at: [78, 44, 24], markup: post(projection, 78, 44, 2.2, 0, 46) },
      { at: [112, 44, 24], markup: post(projection, 112, 44, 2.2, 0, 46) },
      { at: [95, 26, 46], markup: slab(projection, { x: 74, y: 4, w: 42, d: 44, r: 2 }, 44, 5, "mid", { bevel: 0.4 }) },
      { at: [95, 26, 30], markup: disc(projection, 95, 26, 14, 4.6, 28, "mid") },
      { at: [95, 26, 14], markup: disc(projection, 95, 26, 12, 7, 2.4, "hi") },
    ],
    projection,
  );
  return part(
    "press",
    "Build press",
    "The ram over the empty belt. A crate that has passed the jig stops here and leaves as an artifact. The shoe at the bottom of the ram is the build.",
    [95, 26, 30],
    100,
    markup,
    projection,
  );
}

function gate(projection: Projection) {
  const markup = stack(
    [
      { at: [148, 10, 20], markup: post(projection, 148, 10, 2.4, 0, 36) },
      { at: [148, 42, 20], markup: post(projection, 148, 42, 2.4, 0, 36) },
      {
        at: [148, 26, 20],
        markup: slab(projection, { x: 145, y: 14, w: 6, d: 24, r: 1 }, 12, 10, "hi", { lit: true, bevel: 0.35, steps: 2 }),
      },
      { at: [160, 10, 22], markup: knob(projection, 160, 10, 18, 2.6, 5.5) },
    ],
    projection,
  );
  return part(
    "gate",
    "Deploy gate",
    "The lit bar across the end of the belt. It is up, so this revision may leave. The knurled knob is the manual hold: turn it and the bar is yours, not the pipeline's.",
    [148, 26, 20],
    100,
    markup,
    projection,
  );
}
