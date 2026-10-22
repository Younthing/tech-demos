import { depthOf, fitProjection, figureSvg, groupSvg, iso, type Point3, type Projection } from "../vendor/anatomy/iso-kit.ts";
import { VIEW } from "./furniture.ts";
import type { FigureView, Machine } from "./types.ts";

const scales = new Map<string, number>();

function lockedScale(key: string, points: Point3[], elevation: number) {
  const cacheKey = `${key}|${elevation.toFixed(1)}`;
  const cached = scales.get(cacheKey);
  if (cached !== undefined) return cached;
  let scale = Infinity;
  for (let azimuth = 0; azimuth < 360; azimuth += 15) {
    scale = Math.min(scale, fitProjection(points, VIEW.width, VIEW.height, { pad: 22, azimuth, elevation }).scale);
  }
  scales.set(cacheKey, scale);
  return scale;
}

export function frameOf(key: string, points: Point3[], azimuth: number, elevation: number): Projection {
  const scale = lockedScale(key, points, elevation);
  const unit: Projection = { origin: [0, 0], scale: 1, azimuth, elevation };
  const flat = points.map((point) => iso(point, unit));
  const xs = flat.map(([x]) => x);
  const ys = flat.map(([, y]) => y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const up = Math.min(...ys);
  const down = Math.max(...ys);
  return {
    scale,
    azimuth,
    elevation,
    origin: [VIEW.width / 2 - ((left + right) / 2) * scale, VIEW.height / 2 - ((up + down) / 2) * scale],
  };
}

export function renderMachine(machine: Machine, azimuth: number, elevation: number, selectedId: string | null = null): FigureView {
  const projection = frameOf(machine.id, machine.bounds, azimuth, elevation);
  const parts = machine.parts(projection);
  const body = [...parts]
    .sort((a, b) => a.sort - b.sort || depthOf(a.anchor, projection) - depthOf(b.anchor, projection))
    .map((item) =>
      groupSvg(item.markup, {
        class: item.id === selectedId ? "iso-part is-selected" : "iso-part",
        "data-part": item.id,
        role: "button",
        "aria-label": item.name,
        "aria-pressed": item.id === selectedId ? "true" : "false",
      }),
    )
    .join("");
  const svg = figureSvg({
    width: VIEW.width,
    height: VIEW.height,
    label: machine.summary,
    body,
  }).replace('role="img"', 'role="group"');
  return {
    svg,
    parts: parts.map(({ id, name, description }) => ({ id, name, description })),
  };
}

export function wrapDegrees(value: number) {
  const turned = value % 360;
  return turned < 0 ? turned + 360 : turned;
}

export function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}
