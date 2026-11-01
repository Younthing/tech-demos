import { describe, expect, test } from "bun:test";
import { busyCursor, reduceExecution } from "./applyMessage";
import { replyTo, type KernelMessage } from "./messages";
import type { CodeCell } from "./model";

const request = {
  channel: "shell",
  header: {
    msg_id: "req",
    session: "s",
    username: "notebook",
    date: "2026-01-01T00:00:00.000Z",
    msg_type: "execute_request",
    version: "5.3",
  },
  parent_header: {},
  metadata: {},
  content: { code: "1" },
} as KernelMessage;

function cell(): CodeCell {
  return {
    id: "c",
    cell_type: "code",
    source: "1",
    outputs: [],
    execution_count: null,
    metadata: {},
  };
}

function applyAll(messages: KernelMessage[]) {
  let current = cell();
  let cursor = busyCursor();
  for (const message of messages) {
    const next = reduceExecution(current, cursor, message);
    current = next.cell;
    cursor = next.cursor;
  }
  return { cell: current, cursor };
}

describe("reduceExecution", () => {
  test("appends stdout chunks and keeps stderr separate", () => {
    const { cell: next } = applyAll([
      replyTo(request, "iopub", "stream", { name: "stdout", text: "hel" }),
      replyTo(request, "iopub", "stream", { name: "stdout", text: "lo\n" }),
      replyTo(request, "iopub", "stream", { name: "stderr", text: "warn\n" }),
    ]);
    expect(next.outputs).toEqual([
      { output_type: "stream", name: "stdout", text: "hello\n" },
      { output_type: "stream", name: "stderr", text: "warn\n" },
    ]);
  });

  test("waits for both the shell reply and iopub idle", () => {
    const replyFirst = applyAll([
      replyTo(request, "iopub", "status", { execution_state: "busy" }),
      replyTo(request, "iopub", "execute_result", {
        execution_count: 4,
        data: { "text/plain": "42" },
        metadata: {},
      }),
      replyTo(request, "shell", "execute_reply", {
        status: "ok",
        execution_count: 4,
        user_expressions: {},
        payload: [],
      }),
    ]);
    expect(replyFirst.cursor.state).toBe("busy");
    expect(replyFirst.cell.execution_count).toBe(4);

    const settled = reduceExecution(
      replyFirst.cell,
      replyFirst.cursor,
      replyTo(request, "iopub", "status", { execution_state: "idle" }),
    );
    expect(settled.cursor.state).toBe("success");

    const idleFirst = applyAll([
      replyTo(request, "iopub", "status", { execution_state: "idle" }),
    ]);
    expect(idleFirst.cursor.state).toBe("busy");
    const done = reduceExecution(
      idleFirst.cell,
      idleFirst.cursor,
      replyTo(request, "shell", "execute_reply", {
        status: "ok",
        execution_count: 1,
        user_expressions: {},
        payload: [],
      }),
    );
    expect(done.cursor.state).toBe("success");
  });

  test("keeps error when the reply arrives after the error message", () => {
    const { cell: next, cursor } = applyAll([
      replyTo(request, "iopub", "error", {
        ename: "NameError",
        evalue: "name 'x' is not defined",
        traceback: ["NameError: name 'x' is not defined"],
      }),
      replyTo(request, "shell", "execute_reply", {
        status: "error",
        execution_count: 2,
        ename: "NameError",
        evalue: "name 'x' is not defined",
        traceback: ["NameError: name 'x' is not defined"],
      }),
      replyTo(request, "iopub", "status", { execution_state: "idle" }),
    ]);
    expect(cursor.state).toBe("error");
    expect(next.execution_count).toBe(2);
    expect(next.outputs.filter((output) => output.output_type === "error")).toHaveLength(1);
  });

  test("stays busy until the reply and idle status both arrive", () => {
    const { cursor } = applyAll([
      replyTo(request, "iopub", "error", {
        ename: "NameError",
        evalue: "missing",
        traceback: ["NameError: missing"],
      }),
    ]);
    expect(cursor.state).toBe("busy");
    expect(cursor.failed).toBe(true);
  });

  test("records an error reply that never sent an iopub error", () => {
    const { cursor, cell: next } = applyAll([
      replyTo(request, "shell", "execute_reply", {
        status: "error",
        execution_count: 1,
        ename: "SyntaxError",
        evalue: "bad",
        traceback: ["SyntaxError: bad"],
      }),
      replyTo(request, "iopub", "status", { execution_state: "idle" }),
    ]);
    expect(cursor.state).toBe("error");
    expect(next.outputs[0]).toMatchObject({ output_type: "error", ename: "SyntaxError" });
  });
});
