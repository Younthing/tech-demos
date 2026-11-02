import type { NotebookDocument } from "./model";

export const SAMPLE_PRINT_SOURCE = `name = "storybook"
print("hello from", name)`;

export const SAMPLE_RESULT_SOURCE = "2 + 40";

export const SAMPLE_HTML_SOURCE = `display_html(
  '<table><tr><th>Channel</th><th>Message</th></tr>'
  + '<tr><td>shell</td><td>execute_reply</td></tr>'
  + '<tr><td>iopub</td><td>stream</td></tr></table>'
)`;

export const SAMPLE_ERROR_SOURCE = "print(undefined_name)";

export function createSampleNotebook(): NotebookDocument {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        name: "mock",
        display_name: "Mock Python",
        language: "python",
      },
      language_info: { name: "python" },
    },
    cells: [
      {
        id: "intro",
        cell_type: "markdown",
        metadata: {},
        source: `## Kernel messages

Run a code cell to send an \`execute_request\`. The mock kernel replies with \`stream\`, \`execute_result\`, or \`error\`, then \`execute_reply\`.

Double-click to edit this cell. Ctrl+Enter runs the focused code cell.`,
      },
      {
        id: "hello",
        cell_type: "code",
        metadata: {},
        source: SAMPLE_PRINT_SOURCE,
        outputs: [],
        execution_count: null,
      },
      {
        id: "expr",
        cell_type: "code",
        metadata: {},
        source: SAMPLE_RESULT_SOURCE,
        outputs: [],
        execution_count: null,
      },
      {
        id: "table",
        cell_type: "code",
        metadata: {},
        source: SAMPLE_HTML_SOURCE,
        outputs: [],
        execution_count: null,
      },
      {
        id: "failure",
        cell_type: "code",
        metadata: {},
        source: SAMPLE_ERROR_SOURCE,
        outputs: [],
        execution_count: null,
      },
    ],
  };
}
