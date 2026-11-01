# Notebook storybook

## Goal

Ship a Storybook-first prototype of a self-built Jupyter-style notebook (markdown and code cells, run one cell, show output) that follows microsoft/vscode-jupyter’s cell and execution model and Jupyter Server’s WebSocket messaging, without embedding VS Code or any Jupyter UI package.

## Single-user MVP

In:

- A Storybook story that renders one notebook document: markdown cells and code cells.
- Edit cell source in the UI (CodeMirror for code, textarea plus preview for markdown).
- Run one code cell. Show execution state `idle` | `busy` | `success` | `error`, plus outputs: stdout/stderr stream, optional rich `display_data` / `execute_result`, and `error`.
- A typed document shaped like nbformat and the cell vscode-jupyter executes: `id`, `cell_type` (`code` | `markdown`), `source`, `outputs[]`, `execution_count`, `metadata`. Runtime execution state sits beside the document, the way VS Code’s `NotebookCellExecutionState` sits beside the notebook model.
- One kernel session interface. The story uses an in-memory mock that emits the same Jupyter message shapes (`execute_request`, `status`, `stream`, `display_data`, `execute_result`, `error`, `execute_reply`). A Jupyter Server WebSocket adapter implements that interface and is covered by codec tests. Storybook does not open a socket and does not need Jupyter installed.
- `bun run dev` renders the same notebook as the story, so the app folder matches the monorepo run command.

Out:

- JupyterLab or VS Code notebook parity, collaborative editing, file browser, kernel picker, stdin prompts, ipywidgets, raw ZeroMQ, persistence UI.
- `@datalayer/jupyter-react`, `jupyter-ui`, any `@jupyterlab/*` package, and the VS Code extension host.
- Anything outside `apps/notebook-storybook/`. `tracking/seen-bookmarks.json` stays untouched.

## Tasks

1. Scaffold Vite + React + TypeScript, then shadcn/ui (Sera) and Storybook, after `bunfig.toml` exists. Confirm `bun run dev` paints a notebook shell.
2. Define the notebook document, nbformat conversion, and a Storybook story that renders the sample markdown and code cells.
3. Make both cell types editable and keep the document in React state.
4. Run one code cell: mock kernel emits Jupyter messages, a reducer folds them into outputs and execution state, the cell shows stream, rich, and error output.
5. Stub the Jupyter Server adapter behind the same session interface (channels URL, JSON text frames, default binary frames). Unit-test the codec and the request/reply loop with a fake socket.
6. README: how to run Storybook, what was taken from vscode-jupyter, how a real Jupyter Server plugs in.

## Stack

- Bun. Runtime, package manager, and test runner. `bunfig.toml` sets `minimumReleaseAge = 259200` before any install.
- Vite + React + TypeScript via `bunx create-vite`. Official scaffold, one screen, no extra app framework.
- Storybook 10 (`@storybook/react-vite`) instead of Storybook 8. Storybook 8 is two majors behind the current React+Vite framework; 10.6 still uses CSF3 stories, and 10.6.5 (27 Oct 2026) clears the three-day install gate. `storybook@latest init` is the supported scaffold.
- shadcn/ui, `--base radix --preset sera`. Sera is the named preset described as minimal and editorial (square corners, serif headings, little chrome). That is the minimalist preset available in the CLI; there is no preset id literally named `minimalist`.
- CodeMirror 6 (`@codemirror/view`, `lang-python`, commands, language) for code cells. Smaller than Monaco in a Storybook bundle, and we talk to it directly rather than through a JupyterLab editor package.
- `react-markdown` for markdown preview. Prebuilt, and it does not render raw HTML by default.
- React `useState` for the document. One notebook, no store.
- `bun test` for the message reducer, mock kernel, HTML sanitizer, and WebSocket codec. No git hooks: the check is one local test command.

## Cell and message model

References, not dependencies:

- [vscode-jupyter kernel architecture](https://github.com/microsoft/vscode-jupyter/blob/main/.github/instructions/kernel.instructions.md): `NotebookKernelExecution` queues a cell, `CellExecution` sends `execute_request` on the session, `CellExecutionMessageHandler` folds iopub messages into outputs and finishes on `execute_reply`. Sessions are either Jupyter Server (HTTP/WebSocket) or raw ZeroMQ. This demo implements the WebSocket shape only.
- VS Code execution states used by vscode-jupyter tests: `Idle`, `Pending`, `Executing`. The UI here shows `idle` and `busy` (executing). `success` and `error` come from `execute_reply.status`, which vscode-jupyter surfaces as `executionSummary.success`. Pending queues are out of scope: one kernel, run buttons disabled while a cell is busy.
- [Jupyter messaging](https://jupyter-client.readthedocs.io/en/stable/messaging.html) protocol 5.3: shell `execute_request` / `execute_reply`; iopub `status` (`busy` | `idle`), `stream`, `display_data`, `execute_result`, `error`. A request is complete only after both the shell reply and the iopub `idle` whose parent is that request. vscode-jupyter uses the same rule (`gotIdleIOPubStatus && gotShellReply` in `cellExecutionMessageHandler.ts`).
- [Jupyter Server WebSocket protocols](https://jupyter-server.readthedocs.io/en/latest/developers/websocket-protocols.html): one socket at `/api/kernels/<id>/channels` multiplexes shell, iopub, stdin, control, and heartbeat. Messages with no binary buffers are JSON text. Messages with buffers use the default big-endian offset frame (`serialize_binary_message` in `jupyter_server`). The v1 subprotocol is documented and not implemented.

The mock kernel is a tiny Python-like interpreter (`print`, assignment, arithmetic, `display_html`, `raise`). It keeps a namespace for the session so later cells see earlier assignments. It is not Python and not a kernel process.

Rich HTML goes through `sanitize-html` (a real parser, allowlisted tags, no attributes) before `dangerouslySetInnerHTML`. A hand-rolled regular expression was rejected: deleting a splitter tag can rejoin the leftover bytes into an iframe or a `javascript:` URL.

## Layout

```text
src/notebook/model.ts              document, outputs, nbformat conversion
src/notebook/messages.ts           protocol 5.3 message types and constructors
src/notebook/applyMessage.ts       fold one kernel message into a code cell
src/notebook/mockKernel.ts         in-memory kernel session
src/notebook/jupyterServer.ts      channels URL, frame codec, socket session
src/notebook/sanitizeHtml.ts
src/notebook/sampleNotebook.ts
src/notebook/NotebookApp.tsx       shell and run loop
src/notebook/CodeCellView.tsx
src/notebook/MarkdownCellView.tsx
src/notebook/CodeEditor.tsx        CodeMirror 6
src/notebook/OutputView.tsx
src/notebook/ExecutionMark.tsx
src/notebook/Notebook.stories.tsx
src/main.tsx                       same shell for bun run dev
```

shadcn components live in `src/components/ui` and are added only as the shell needs them (`button`, `badge`, `separator`, `textarea`).

## Deferred

- Starting or listing kernels via the Jupyter REST API. The adapter assumes a kernel id already exists.
- Heartbeat, stdin, comms, and the v1 WebSocket subprotocol.
- Interrupt, restart, run-all, add/delete/reorder cells, and `.ipynb` save/open UI. `toNbformat` exists so the document shape is real; there is no file UI.
- Raw ZeroMQ sessions. vscode-jupyter uses those for local kernels; a browser demo cannot open ZMQ.
- Git hooks. `bun test` is the check.
