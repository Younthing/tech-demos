import { describe, expect, test } from "bun:test";
import { fromNbformat, sourceToNbformat, toNbformat } from "./model";
import { createSampleNotebook, SAMPLE_PRINT_SOURCE } from "./sampleNotebook";

describe("nbformat", () => {
  test("splits source into notebook lines", () => {
    expect(sourceToNbformat(SAMPLE_PRINT_SOURCE)).toEqual([
      'name = "storybook"\n',
      'print("hello from", name)',
    ]);
    expect(sourceToNbformat("")).toEqual([]);
    expect(sourceToNbformat("a\n")).toEqual(["a\n"]);
  });

  test("round-trips a document through line arrays", () => {
    const document = createSampleNotebook();
    const wire = toNbformat(document);
    const code = wire.cells[1];
    if (!code || code.cell_type !== "code") throw new Error("missing code cell");
    expect(code.source).toEqual(sourceToNbformat(SAMPLE_PRINT_SOURCE));
    expect(fromNbformat(wire)).toEqual(document);
  });

  test("reads a string source and empty outputs", () => {
    const document = fromNbformat({
      cells: [
        {
          id: "m",
          cell_type: "markdown",
          source: "# Title",
          metadata: {},
        },
        {
          cell_type: "code",
          source: ["1\n", "+ 1"],
          execution_count: 3,
          outputs: [
            { output_type: "stream", name: "stdout", text: ["hi", "\n"] },
          ],
        },
      ],
    });
    expect(document.cells[0]?.source).toBe("# Title");
    const code = document.cells[1];
    if (!code || code.cell_type !== "code") throw new Error("missing code cell");
    expect(code.source).toBe("1\n+ 1");
    expect(code.execution_count).toBe(3);
    expect(code.outputs).toEqual([
      { output_type: "stream", name: "stdout", text: "hi\n" },
    ]);
  });

  test("rejects cell types outside the demo", () => {
    expect(() =>
      fromNbformat({ cells: [{ cell_type: "raw", source: "x" }] }),
    ).toThrow(/Unsupported cell_type/);
  });
});
