import type { Projection } from "../vendor/anatomy/iso-kit.ts";
import { bedplate, bounds, disc, gauge, knob, part, post, screws, slab, stack } from "./furniture.ts";
import type { Machine } from "./types.ts";

const TOKENS = 5;
const FULL = 8;

export const tokenBucket: Machine = {
  id: "token-bucket",
  fig: "Fig 3",
  title: "Token bucket",
  kind: "Rate limiter",
  summary:
    "A header tank drips tokens onto a stack of five discs. A scale reads the stack out of eight, and a turnstile in front opens only while a disc is there to take.",
  caption:
    "Five discs are standing. The scale needle is at 5/8 of a turn. The lit disc is the one a request can take.",
  legendLit: "The token a request can take",
  legendRaised: "Tank, valve, stack, scale, and turnstile",
  bounds: bounds(),
  parts: (projection) => [
    part(
      "bedplate",
      "Bedplate",
      "The limiter is a bench instrument: tank, stack, and gate on one plate. The engraved plate reads BUCKET.",
      [-10, 0, -6],
      0,
      bedplate(projection, "BUCKET"),
      projection,
    ),
    tank(projection),
    valve(projection),
    stackOfTokens(projection),
    scale(projection),
    turnstile(projection),
    overflow(projection),
  ],
};

function tank(projection: Projection) {
  const body = { x: -124, y: -40, w: 74, d: 44, r: 3 };
  const lid = { x: -118, y: -34, w: 62, d: 32, r: 2 };
  const markup = [
    slab(projection, body, 0, 28, "mid", { bevel: 0.7, seam: true, steps: 5 }),
    slab(projection, lid, 28, 2.2, "hi", { bevel: 0.3, steps: 4 }),
    knob(projection, -87, -18, 30.2, 3, 5.5),
    screws(
      projection,
      [
        [-112, -28, 30.2],
        [-62, -28, 30.2],
        [-112, -8, 30.2],
        [-62, -8, 30.2],
      ],
      1.3,
    ),
  ].join("");
  return part(
    "tank",
    "Header tank",
    "The reservoir. Its volume is the burst you could have had, not the tokens standing on the scale. The knob on the lid is the fill. It stands on the bedplate.",
    [-87, -18, 16],
    100,
    markup,
    projection,
  );
}

function valve(projection: Projection) {
  const markup = [
    disc(projection, -58, 5, 18, 2.2, 12, "mid"),
    disc(projection, -58, 5, 20, 5.2, 7, "hi"),
    knob(projection, -48, 5, 22, 2.7, 5.5),
  ].join("");
  return part(
    "valve",
    "Metering valve",
    "The pipe leaves the front of the tank and stops just above the stack. The bulge is the valve and the side knob is the refill rate: how fast a new disc is allowed to land.",
    [-58, 5, 24],
    110,
    markup,
    projection,
  );
}

function stackOfTokens(projection: Projection) {
  const discs = Array.from({ length: TOKENS }, (_, index) => {
    const z = 6.4 + index * 2.35;
    const lit = index === TOKENS - 1;
    return {
      at: [-58, 20, z] as [number, number, number],
      markup: disc(projection, -58, 20, z, 8, 2.1, "hi", lit),
    };
  });
  const markup = stack(
    [{ at: [-58, 20, 10], markup: disc(projection, -58, 20, 6.2, 1.5, 13, "mid") }, ...discs],
    projection,
  );
  return part(
    "stack",
    "Token stack",
    "The bucket itself. Five discs stand on the scale, and the top one is lit: that is the token a request can take. The spindle keeps them coaxial.",
    [-58, 20, 14],
    130,
    markup,
    projection,
  );
}

function scale(projection: Projection) {
  const markup = [
    slab(projection, { x: -72, y: 14, w: 20, d: 14, r: 1.5 }, 0, 3, "lo", { steps: 2 }),
    slab(projection, { x: -104, y: 8, w: 112, d: 26, r: 2 }, 3, 3.2, "mid", { bevel: 0.4 }),
    post(projection, -6, 20, 2.3, 6.2, 24),
    gauge(projection, -6, 20, 24, 10, TOKENS / FULL),
  ].join("");
  return part(
    "scale",
    "Scale",
    "The beam under the stack, with the dial at its right end. Full scale is 8 discs. Five are standing, so the needle sits at 5/8 of a turn.",
    [-58, 20, 8],
    70,
    markup,
    projection,
  );
}

function turnstile(projection: Projection) {
  const markup = stack(
    [
      { at: [-96, 54, 16], markup: post(projection, -96, 54, 2.3, 0, 26) },
      { at: [-28, 54, 16], markup: post(projection, -28, 54, 2.3, 0, 26) },
      { at: [-62, 54, 16], markup: slab(projection, { x: -92, y: 51, w: 60, d: 6, r: 1.2 }, 13, 4.2, "hi", { bevel: 0.35 }) },
      { at: [-62, 58, 1], markup: slab(projection, { x: -104, y: 46, w: 84, d: 14, r: 2 }, 0, 1.4, "lo", { crease: "none" }) },
    ],
    projection,
  );
  return part(
    "turnstile",
    "Turnstile",
    "The gate a request walks through, in front of the stack. Take the lit disc and the next request waits until the valve lands another.",
    [-62, 54, 14],
    100,
    markup,
    projection,
  );
}

function overflow(projection: Projection) {
  const markup = [
    slab(projection, { x: 22, y: 16, w: 28, d: 24, r: 2 }, 0, 2, "lo", { steps: 3 }),
    stack(
      [
        { at: [36, 18, 6], markup: slab(projection, { x: 22, y: 16, w: 28, d: 3, r: 1 }, 2, 7, "mid", { steps: 2 }) },
        { at: [36, 37, 6], markup: slab(projection, { x: 22, y: 37, w: 28, d: 3, r: 1 }, 2, 5, "mid", { steps: 2 }) },
        { at: [24, 26, 6], markup: slab(projection, { x: 22, y: 19, w: 3, d: 18, r: 1 }, 2, 7, "mid", { steps: 2 }) },
        { at: [47, 26, 6], markup: slab(projection, { x: 47, y: 19, w: 3, d: 18, r: 1 }, 2, 5, "mid", { steps: 2 }) },
      ],
      projection,
    ),
  ].join("");
  return part(
    "overflow",
    "Overflow tray",
    "When the stack already holds eight, the next drip misses and lands here. Those discs are spent. They do not open the turnstile.",
    [36, 28, 4],
    90,
    markup,
    projection,
  );
}
