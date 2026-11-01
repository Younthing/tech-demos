import type { NotebookDocument } from "./model";

export const SAMPLE_PRINT_SOURCE = `name = "storybook"
print("hello from", name)`;

export const SAMPLE_RESULT_SOURCE = "2 + 40";

export const SAMPLE_HTML_SOURCE = `display_html('<table><thead><tr><th>Channel</th><th>Message</th></tr></thead><tbody><tr><td>shell</td><td>execute_reply</td></tr><tr><td>iopub</td><td>stream</td></tr></tbody></table>')`;

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
        source: `## A cell, then a kernel message

This notebook is a self-built cell surface. The document matches the cells vscode-jupyter executes. Run sends an \`execute_request\`. The mock kernel answers with Jupyter messages: \`status\`, \`stream\`, \`execute_result\` or \`error\`, then \`execute_reply\`.

- Edit any cell.
- Run one code cell. Assignments stay in the mock kernel for the next cell.
- Press Ctrl+Enter or Cmd+Enter in a code cell to run it.`,
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
