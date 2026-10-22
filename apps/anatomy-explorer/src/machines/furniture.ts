import * as k from "../vendor/anatomy/iso-kit.ts";
import type { Part } from "./types.ts";

export const PLATE: k.Plan = { x: -186, y: -90, w: 380, d: 180, r: 10 };
export const VIEW = { width: 720, height: 480 };
export const CEILING = 72;

const PLATE_H = 12;
const FOOT_H = 5;

export function bounds(): k.Point3[] {
  return k.boxCorners(PLATE, -PLATE_H - FOOT_H, CEILING);
}

export function stack(pieces: Array<{ at: k.Point3; markup: string }>, projection: k.Projection) {
  return [...pieces]
    .sort((a, b) => k.depthOf(a.at, projection) - k.depthOf(b.at, projection))
    .map((piece) => piece.markup)
    .join("");
}

export function part(
  id: string,
  name: string,
  description: string,
  anchor: k.Point3,
  band: number,
  markup: string,
  projection: k.Projection,
): Part {
  return {
    id,
    name,
    description,
    anchor,
    sort: band + k.depthOf(anchor, projection) * 0.01,
    markup,
  };
}

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style);
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style);
const D = (points: Array<k.Flat | [number, number, number]>, style?: { size?: number; tone?: k.Tone }) => k.dotsSvg(points, style);

function byDepth(points: k.Plane[], projection: k.Projection) {
  return [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], projection) - k.depthOf([b[0], b[1], 0], projection));
}

export function screws(projection: k.Projection, points: k.Point3[], radius = 1.7) {
  const rings = points.map(([x, y, z]) => k.ring(x, y, radius, z, projection, 14)).join("");
  return L(rings, { tone: "lo" }) + D(points.map((point) => k.iso(point, projection)), { size: 0.42 });
}

export function slab(
  projection: k.Projection,
  plan: k.Plan,
  z: number,
  height: number,
  tone: k.Tone = "mid",
  options: { bevel?: number; seam?: boolean; steps?: number; lit?: boolean; crease?: k.Tone | "none" } = {},
) {
  const steps = options.steps ?? 4;
  const bevel = options.bevel ?? (height > 3 ? 0.55 : 0);
  const seamAt = z + Math.min(height * 0.62, Math.max(0.4, height - 0.5));
  const seam = options.seam ? k.sideSeam(plan, seamAt, projection, steps) : "";
  return S(k.slabOf(plan, z, height, projection, steps, bevel), {
    tone,
    lit: options.lit,
    crease: options.crease ?? (height < 1.2 ? "none" : "faint"),
    inner: seam ? L(seam, { tone: "faint" }) : "",
  });
}

export function knob(projection: k.Projection, x: number, y: number, z: number, radius = 3.1, height = 6) {
  return [
    S(k.cylinder(x, y, radius * 0.5, z, 1.3, projection, 16), { tone: "mid", crease: "none" }),
    S(k.cylinder(x, y, radius, z + 1.3, height - 1.3, projection, 24), { tone: "mid" }),
    L(k.knurl(x, y, radius, z + 1.5, z + height - 0.25, Math.max(18, Math.round(radius * 8)), projection), { tone: "lo" }),
    L(k.lineOnTop([x - radius * 0.72, y], [x + radius * 0.72, y], z + height, projection), { tone: "hi" }),
    D([k.iso([x, y, z + height], projection)], { size: 0.4, tone: "hi" }),
  ].join("");
}

export function post(projection: k.Projection, x: number, y: number, radius: number, z0: number, z1: number) {
  const height = z1 - z0;
  return [
    S(k.cylinder(x, y, radius * 1.45, z0, 1.5, projection, 18), { tone: "lo" }),
    S(k.cylinder(x, y, radius, z0 + 1.5, Math.max(1, height - 3.1), projection, 18), { tone: "mid", crease: "none" }),
    L(k.sideArc(x, y, radius, z0 + height * 0.5, projection, 14), { tone: "faint" }),
    S(k.cylinder(x, y, radius * 1.22, z1 - 1.6, 1.6, projection, 18), { tone: "mid" }),
  ].join("");
}

export function disc(
  projection: k.Projection,
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  tone: k.Tone = "hi",
  lit = false,
) {
  return S(k.cylinder(x, y, radius, z, height, projection, radius > 8 ? 40 : 28, height > 2 ? 0.3 : 0), {
    tone,
    lit,
    crease: height < 1.4 ? "none" : "lo",
  });
}

export function faceRing(projection: k.Projection, x: number, y: number, z: number, radius: number) {
  return L(k.ring(x, y, radius, z, projection, 32), { tone: "lo" });
}

export function rollerKnurl(projection: k.Projection, x: number, y: number, radius: number, z0: number, z1: number) {
  return L(k.knurl(x, y, radius, z0, z1, 32, projection), { tone: "lo" });
}

export function gauge(projection: k.Projection, x: number, y: number, z: number, radius: number, turn: number) {
  const height = 8;
  const top = z + height;
  const ticks = k.radialTicks(x, y, radius - 2.3, 40, 5, top, [1.2, 2.4], projection);
  const angle = turn * Math.PI * 2;
  const needle = k.lineOnTop(
    [x - Math.sin(angle) * 2.2, y + Math.cos(angle) * 2.2],
    [x + Math.sin(angle) * (radius - 3.2), y - Math.cos(angle) * (radius - 3.2)],
    top + 0.2,
    projection,
  );
  return [
    S(k.cylinder(x, y, radius, z, height, projection, 56, 0.45), { tone: "hi", crease: "lo" }),
    L(k.knurl(x, y, radius, top - 2.4, top - 0.35, 56, projection, 0.25), { tone: "lo" }),
    L(k.ring(x, y, radius - 1.6, top, projection, 48), { tone: "lo" }),
    L(ticks.minor, { tone: "lo" }),
    L(ticks.major, { tone: "mid" }),
    L(needle, { tone: "hi", free: "start" }),
    S(k.cylinder(x, y, 1.2, top, 0.9, projection, 14), { tone: "mid" }),
  ].join("");
}

export function bedplate(projection: k.Projection, engraved: string) {
  const footBase = -PLATE_H - FOOT_H;
  const chunks: string[] = [`<path class="iso-halo" d="${k.haloOf(PLATE, footBase, PLATE_H, projection)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24), projection)) {
    chunks.push(S(k.cylinder(x, y, 7, footBase, 1.6, projection, 28), { tone: "lo" }));
    chunks.push(S(k.cylinder(x, y, 5.4, footBase + 1.6, FOOT_H - 1.6, projection, 28), { tone: "mid" }));
  }
  chunks.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, projection, 8, 1.4), { tone: "mid" }));
  chunks.push(L(k.planOutline(k.insetPlan(PLATE, 6), 0, projection), { tone: "lo" }));
  const screwPoints = k.corners(PLATE, 12);
  chunks.push(screws(projection, screwPoints.map(([x, y]) => [x, y, 0]), 2.1));

  const strip: k.Plan = { x: PLATE.x + 28, y: PLATE.y + PLATE.d - 16, w: PLATE.w - 56, d: 7, r: 1 };
  chunks.push(S(k.slabOf(strip, 0, 0.6, projection, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.7, 0.6, [2, 3.6], projection);
  chunks.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  chunks.push(
    D(
      [k.iso([strip.x + 2, strip.y + 3.5, 0.6], projection), k.iso([strip.x + strip.w - 2, strip.y + 3.5, 0.6], projection)],
      { size: 0.4 },
    ),
  );

  const label: k.Plan = { x: PLATE.x + 18, y: PLATE.y + 14, w: 42, d: 16, r: 1.2 };
  chunks.push(S(k.slabOf(label, 0, 0.8, projection, 4), { tone: "lo", crease: "none" }));
  chunks.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, projection, 4), { tone: "faint" }));
  chunks.push(
    screws(projection, [
      [label.x + 2.4, label.y + 2.4, 0.8],
      [label.x + label.w - 2.4, label.y + 2.4, 0.8],
    ], 1.1),
  );
  chunks.push(
    k.faceTextSvg(k.topMatrix([label.x + label.w / 2, label.y + 10.5], 0.9, projection), engraved, {
      size: 4.2,
      tone: "mid",
      anchor: "middle",
    }),
  );
  return chunks.join("");
}
