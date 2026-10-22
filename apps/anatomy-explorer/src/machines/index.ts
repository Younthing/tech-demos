import { buildLine } from "./build-line.ts";
import { renderMachine } from "./project.ts";
import { tokenBucket } from "./token-bucket.ts";
import { tokenMill } from "./token-mill.ts";
import type { FigureView, Machine } from "./types.ts";

export const machines: Machine[] = [tokenMill, buildLine, tokenBucket];

export function machineById(id: string) {
  return machines.find((machine) => machine.id === id) ?? tokenMill;
}

export { renderMachine };
export type { FigureView, Machine };
