import type { Point3, Projection } from "../vendor/anatomy/iso-kit.ts";

export type Part = {
  id: string;
  name: string;
  description: string;
  anchor: Point3;
  sort: number;
  markup: string;
};

export type Machine = {
  id: string;
  fig: string;
  title: string;
  kind: string;
  summary: string;
  caption: string;
  legendLit: string;
  legendRaised: string;
  bounds: Point3[];
  parts: (projection: Projection) => Part[];
};

export type FigureView = {
  svg: string;
  parts: Array<Pick<Part, "id" | "name" | "description">>;
};
