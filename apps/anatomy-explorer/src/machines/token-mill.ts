import type { Projection } from "../vendor/anatomy/iso-kit.ts";
import { bedplate, bounds, disc, faceRing, gauge, knob, part, post, rollerKnurl, screws, slab, stack } from "./furniture.ts";
import type { Machine } from "./types.ts";

const TEMPERATURE = 0.7;

export const tokenMill: Machine = {
  id: "token-mill",
  fig: "Fig 1",
  title: "Token mill",
  kind: "LLM pipeline",
  summary:
    "A bench mill that turns a prompt into tokens. Blanks leave a hopper, take a place on a knurled drum, pass four attention heads and a press, and leave through a sampler dialled to temperature 0.7.",
  caption:
    "One token is on the rail, under the second head. The sampler needle sits at 0.7 of a turn: temperature 0.7, where one full turn would be 1.",
  legendLit: "The token the layer is working on",
  legendRaised: "Heads, drum, press, and the hopper of blanks",
  bounds: bounds(),
  parts: (projection) => [
    part(
      "bedplate",
      "Bedplate",
      "The surface plate the mill stands on. Feet, corner screws, an inset groove, and a ruler fix the scale. The engraved plate reads MILL.",
      [-10, 0, -6],
      0,
      bedplate(projection, "MILL"),
      projection,
    ),
    hopper(projection),
    drum(projection),
    rack(projection),
    press(projection),
    sampler(projection),
    rail(projection),
    token(projection),
  ],
};

function hopper(projection: Projection) {
  const floor = { x: -168, y: -8, w: 40, d: 46, r: 2 };
  const markup = [
    slab(projection, floor, 0, 3, "lo", { steps: 3 }),
    stack(
      [
        { at: [-148, -6, 16], markup: slab(projection, { x: -168, y: -8, w: 40, d: 4, r: 1 }, 3, 26, "mid", { seam: true, steps: 3 }) },
        { at: [-166, 12, 14], markup: slab(projection, { x: -168, y: -4, w: 4, d: 34, r: 1 }, 3, 24, "mid", { steps: 2 }) },
        { at: [-130, 12, 14], markup: slab(projection, { x: -132, y: -4, w: 4, d: 34, r: 1 }, 3, 24, "mid", { steps: 2 }) },
        { at: [-148, 32, 8], markup: slab(projection, { x: -164, y: 30, w: 32, d: 4, r: 1 }, 3, 8, "mid", { steps: 2 }) },
        { at: [-156, 8, 7], markup: disc(projection, -156, 8, 3, 3.4, 5, "hi") },
        { at: [-146, 14, 7], markup: disc(projection, -146, 14, 3, 3.4, 5, "hi") },
        { at: [-152, 20, 7], markup: disc(projection, -152, 20, 3, 3.4, 5, "hi") },
      ],
      projection,
    ),
    slab(projection, { x: -132, y: 14, w: 18, d: 22, r: 1.5 }, 0, 2.4, "lo", { steps: 2 }),
    knob(projection, -124, 10, 12, 2.8, 5.5),
    screws(projection, [
      [-162, -2, 29],
      [-138, -2, 29],
    ]),
  ].join("");
  return part(
    "hopper",
    "Hopper",
    "Prompt blanks wait in an open bin. The low front lip is the feed, and the chute carries them onto the rail. The knurled knob is the feed rate.",
    [-148, 12, 16],
    100,
    markup,
    projection,
  );
}

function drum(projection: Projection) {
  const markup = [
    slab(projection, { x: -112, y: -28, w: 36, d: 30, r: 2.5 }, 0, 7, "mid", { bevel: 0.6, steps: 4 }),
    screws(projection, [
      [-106, -22, 7],
      [-82, -22, 7],
    ]),
    post(projection, -94, -14, 2.4, 7, 28),
    disc(projection, -90, 27.5, 3.2, 5.6, 9, "hi"),
    rollerKnurl(projection, -90, 27.5, 5.6, 3.8, 11.6),
    faceRing(projection, -90, 27.5, 12.2, 3.2),
  ].join("");
  return part(
    "drum",
    "Embedding drum",
    "The knurled roller between the rails gives each blank a place in line. One turn of the drum is one token. The housing behind it is the motor.",
    [-94, 8, 14],
    100,
    markup,
    projection,
  );
}

function rack(projection: Projection) {
  const heads = [-6, 24, 54, 84];
  const markup = [
    slab(projection, { x: -20, y: -46, w: 124, d: 30, r: 2 }, 0, 5, "mid", { bevel: 0.45, steps: 3 }),
    screws(
      projection,
      [
        [-12, -40, 5],
        [96, -40, 5],
        [-12, -22, 5],
        [96, -22, 5],
      ],
      1.4,
    ),
    stack(
      heads.map((x) => ({
        at: [x, -32, 24] as [number, number, number],
        markup: [post(projection, x, -32, 2.15, 5, 34), disc(projection, x, -32, 34, 7.2, 8, "hi"), faceRing(projection, x, -32, 42.1, 4.8)].join(""),
      })),
      projection,
    ),
  ].join("");
  return part(
    "rack",
    "Attention rack",
    "Four heads on one bed. Each head looks across the token on the rail. Together they are one layer of attention: same tokens, four views.",
    [42, -32, 24],
    100,
    markup,
    projection,
  );
}

function press(projection: Projection) {
  const markup = stack(
    [
      { at: [135, -8, 3], markup: slab(projection, { x: 112, y: -24, w: 46, d: 34, r: 2 }, 0, 5, "hi", { bevel: 0.5, seam: true }) },
      { at: [120, -10, 28], markup: post(projection, 120, -10, 2.3, 5, 48) },
      { at: [150, -10, 28], markup: post(projection, 150, -10, 2.3, 5, 48) },
      { at: [135, -10, 30], markup: disc(projection, 135, -10, 16, 4.4, 26, "mid") },
      { at: [135, -10, 46], markup: slab(projection, { x: 114, y: -16, w: 42, d: 12, r: 2 }, 44, 5, "mid", { bevel: 0.4 }) },
      { at: [156, -10, 52], markup: knob(projection, 156, -10, 49, 2.6, 5) },
    ],
    projection,
  );
  return part(
    "press",
    "Feed-forward press",
    "After the heads look, the ram comes down on the anvil. This is the part of the layer that changes the token. The knob on the beam is how hard the press bears.",
    [135, -8, 28],
    100,
    markup,
    projection,
  );
}

function sampler(projection: Projection) {
  const markup = [
    post(projection, 164, -34, 3, 0, 30),
    gauge(projection, 164, -34, 30, 13, TEMPERATURE),
    knob(projection, 180, -34, 34, 2.4, 5),
    slab(projection, { x: 158, y: 16, w: 22, d: 18, r: 2 }, 0, 3.2, "mid", { steps: 3 }),
  ].join("");
  return part(
    "sampler",
    "Sampler",
    "The dial is temperature. The needle is at 0.7 of a turn, so the spout will pass a less likely token. One full turn would be temperature 1.",
    [164, -10, 34],
    100,
    markup,
    projection,
  );
}

function rail(projection: Projection) {
  const stop = (x: number) => slab(projection, { x, y: 16, w: 5, d: 26, r: 1 }, 0, 7, "mid", { steps: 2 });
  const markup = [
    slab(projection, { x: -114, y: 18, w: 268, d: 4.2, r: 1 }, 0, 3, "mid", { bevel: 0.3, steps: 2 }),
    slab(projection, { x: -114, y: 36, w: 268, d: 4.2, r: 1 }, 0, 3, "mid", { bevel: 0.3, steps: 2 }),
    stop(-120),
    stop(156),
    screws(
      projection,
      [
        [-100, 20, 3],
        [140, 20, 3],
        [-100, 38, 3],
        [140, 38, 3],
      ],
      1.2,
    ),
  ].join("");
  return part(
    "rail",
    "Token rail",
    "The residual path. A token stays on these two rails from the drum to the spout, and every station works on that same row instead of copying it.",
    [20, 28, 2],
    40,
    markup,
    projection,
  );
}

function token(projection: Projection) {
  return part(
    "token",
    "Live token",
    "The lit puck is the token this layer is on, sitting under the second head. The blanks in the hopper have not been placed yet. This one has.",
    [24, 28.2, 6],
    120,
    [disc(projection, 24, 28.2, 3.1, 4.3, 6.2, "hi", true), faceRing(projection, 24, 28.2, 9.4, 2.4)].join(""),
    projection,
  );
}
