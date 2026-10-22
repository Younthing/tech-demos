import { expect, test } from "bun:test";
import { machines, renderMachine } from "../src/machines/index.ts";

test("ships the three bundled machines", () => {
  expect(machines.map((machine) => machine.id)).toEqual(["token-mill", "build-line", "token-bucket"]);
});

for (const machine of machines) {
  test(`${machine.id} draws clickable parts`, () => {
    const view = renderMachine(machine, 38, 32);
    const ids = view.parts.map((part) => part.id);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ids).size).toBe(ids.length);
    for (const part of view.parts) {
      expect(view.svg).toContain(`data-part="${part.id}"`);
      expect(part.name.length).toBeGreaterThan(1);
      expect(part.description.length).toBeGreaterThan(40);
    }
    expect(view.svg).toContain("iso-solid");
    expect(view.svg).toContain("data-lit");
    expect(view.svg).not.toContain("NaN");
    expect(view.svg).not.toContain("undefined");
  });

  test(`${machine.id} changes when the camera orbits`, () => {
    const home = renderMachine(machine, 38, 32).svg;
    const turned = renderMachine(machine, 140, 32).svg;
    const raised = renderMachine(machine, 38, 48).svg;
    expect(home).not.toBe(turned);
    expect(home).not.toBe(raised);
  });

  test(`${machine.id} marks the selected part`, () => {
    const id = renderMachine(machine, 38, 32).parts[0]?.id;
    expect(id).toBeTruthy();
    const selected = renderMachine(machine, 38, 32, id);
    expect(selected.svg).toContain("is-selected");
    expect(selected.svg).toContain(`data-part="${id}"`);
  });
}
