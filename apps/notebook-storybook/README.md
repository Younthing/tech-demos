# Notebook storybook

A Storybook prototype of a Jupyter-style notebook. Markdown and code cells are self-built React components. Running a cell sends a Jupyter `execute_request` and renders the messages that come back.

The demo does not embed VS Code, and it does not depend on `@datalayer/jupyter-react`, `jupyter-ui`, or any `@jupyterlab/*` package.

## Run

From this folder:

```bash
bun install
bun run storybook
```

Storybook serves at <http://127.0.0.1:6006>. Open **Notebook / Document**. Edit a cell, then press **Run** or Ctrl+Enter / Cmd+Enter.

The same notebook is the app:

```bash
bun run dev
```

Checks:

```bash
bun test
bun run lint
bun run build
```

Jupyter does not need to be installed. The story uses an in-memory kernel.

## What this takes from vscode-jupyter

[microsoft/vscode-jupyter](https://github.com/microsoft/vscode-jupyter) (MIT) is the reference for the cell and the way a notebook talks to a kernel. Nothing here imports that repository.

- **Document.** A cell has `id`, `cell_type` (`code` or `markdown`), `source`, `outputs`, `execution_count`, and `metadata`, the same fields nbformat and vscode-jupyter execute. `source` is one string in memory. `toNbformat` writes the nbformat line array.
- **Execution state.** vscode-jupyter drives VS Code's `NotebookCellExecutionState`: Idle, Pending, Executing. This UI shows `idle` and `busy`. `success` and `error` come from `execute_reply.status`, which the extension surfaces as `executionSummary.success`. Pending queues are out of scope: one kernel, and Run is disabled while a cell is busy.
- **Who runs a cell.** The extension's kernel notes describe `NotebookKernelExecution` queueing the cell, `CellExecution` sending `execute_request`, and `CellExecutionMessageHandler` folding iopub messages into outputs. See [kernel.instructions.md](https://github.com/microsoft/vscode-jupyter/blob/main/.github/instructions/kernel.instructions.md).
- **When a run is finished.** `CellExecutionMessageHandler` marks the request complete only after the shell reply **and** an iopub `status` of `idle` whose parent is that request (`gotIdleIOPubStatus && gotShellReply`). `reduceExecution` uses that same rule. Stream chunks with the same name append into one output.
- **Two transports.** vscode-jupyter talks to Jupyter Server over HTTP/WebSocket, or to a kernel process over ZeroMQ. This demo implements the WebSocket message shape only. A browser cannot open ZeroMQ.

Message names follow the [Jupyter messaging spec](https://jupyter-client.readthedocs.io/en/stable/messaging.html) (protocol 5.3): shell `execute_request` / `execute_reply`, and iopub `status`, `stream`, `display_data`, `execute_result`, and `error`.

## Mock kernel

`MockKernelSession` emits those messages without a kernel process. The language is a small Python-like subset:

- `name = "storybook"` and later cells can read `name`
- arithmetic `+ - * /`, parentheses, strings
- `print(...)` becomes a stdout `stream`
- `display_html("...")` becomes `display_data` with `text/html`
- `raise ValueError("...")` and unknown names become an `error` plus an error `execute_reply`

HTML is parsed with `sanitize-html` before it is rendered. Only a small set of tags is kept, and every attribute is removed, so a code cell cannot inject a script into the page.

## Plug in a real Jupyter Server later

`JupyterServerKernelSession` implements the same `KernelSession` interface as the mock. Storybook does not construct it.

```ts
import { NotebookApp } from "./src/notebook/NotebookApp";
import { createJupyterServerSession } from "./src/notebook/jupyterServer";

const session = createJupyterServerSession({
  baseUrl: "http://127.0.0.1:8888",
  kernelId: "<id from POST /api/kernels>",
  token: "<jupyter token>",
});

<NotebookApp session={session} delayMs={0} />;
```

What the adapter does:

- Opens `ws://<host>/api/kernels/<kernelId>/channels?session_id=<id>&token=<token>` (and `wss:` for `https:`). A base path on `baseUrl` is kept, so a JupyterHub prefix works.
- Sends `execute_request` as a JSON text frame when there are no binary buffers. Jupyter Server accepts that on the default protocol.
- Decodes JSON replies, and binary frames when a message includes buffers. The frame is the default protocol in [Jupyter Server's WebSocket docs](https://jupyter-server.readthedocs.io/en/latest/developers/websocket-protocols.html): big-endian uint32 count and offsets, matching `serialize_binary_message`.
- Yields messages for that request until both `execute_reply` and iopub `idle` arrive. The notebook reducer is unchanged.

What it does not do:

- Start or list kernels. You already need a kernel id from the REST API.
- Heartbeat, stdin, comms, or the `v1.kernel.websocket.jupyter.org` subprotocol.
- Raw ZeroMQ. That path in vscode-jupyter is for a local kernel process, not for this browser demo.

Pass `session` into `NotebookApp` and leave the story on the mock.
