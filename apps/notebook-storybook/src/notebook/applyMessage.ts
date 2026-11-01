import type {
  CodeCell,
  ExecutionState,
  MimeBundle,
  NotebookOutput,
} from "./model";
import type {
  DisplayDataContent,
  ErrorContent,
  ExecuteReplyContent,
  ExecuteResultContent,
  KernelMessage,
  StatusContent,
  StreamContent,
} from "./messages";

/**
 * Folds one kernel message into a code cell.
 * Stream chunks with the same name append, matching vscode-jupyter's
 * cell output handler. Success or error is settled only once both the
 * shell reply and the iopub idle status have arrived.
 */
export type ExecutionCursor = {
  state: ExecutionState;
  sawReply: boolean;
  sawIdle: boolean;
  failed: boolean;
};

export function busyCursor(): ExecutionCursor {
  return { state: "busy", sawReply: false, sawIdle: false, failed: false };
}

function joinText(text: unknown): string {
  if (typeof text === "string") return text;
  if (Array.isArray(text)) {
    return text.filter((part): part is string => typeof part === "string").join("");
  }
  return "";
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((part): part is string => typeof part === "string");
  return [];
}

function textField(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asMime(data: unknown): MimeBundle {
  const bundle: MimeBundle = {};
  if (!data || typeof data !== "object" || Array.isArray(data)) return bundle;
  for (const [key, value] of Object.entries(data)) {
    bundle[key] = joinText(value);
  }
  return bundle;
}

function appendStream(
  outputs: NotebookOutput[],
  name: "stdout" | "stderr",
  text: string,
): NotebookOutput[] {
  if (text.length === 0) return outputs;
  const last = outputs[outputs.length - 1];
  if (last && last.output_type === "stream" && last.name === name) {
    return [
      ...outputs.slice(0, -1),
      { ...last, text: last.text + text },
    ];
  }
  return [...outputs, { output_type: "stream", name, text }];
}

function settle(cursor: ExecutionCursor): ExecutionState {
  if (cursor.sawIdle && cursor.sawReply) {
    return cursor.failed ? "error" : "success";
  }
  return cursor.state === "idle" ? "idle" : "busy";
}

export function reduceExecution(
  cell: CodeCell,
  cursor: ExecutionCursor,
  message: KernelMessage,
): { cell: CodeCell; cursor: ExecutionCursor } {
  const nextCursor: ExecutionCursor = { ...cursor };
  let outputs = cell.outputs;
  let executionCount = cell.execution_count;

  if (message.channel === "iopub" && message.header.msg_type === "status") {
    const content = message.content as StatusContent;
    if (content.execution_state === "busy" && !nextCursor.failed) {
      nextCursor.state = "busy";
    }
    if (content.execution_state === "idle") nextCursor.sawIdle = true;
  }

  if (message.channel === "iopub" && message.header.msg_type === "stream") {
    const content = message.content as StreamContent;
    if (content.name === "stdout" || content.name === "stderr") {
      outputs = appendStream(outputs, content.name, joinText(content.text));
    }
  }

  if (message.channel === "iopub" && message.header.msg_type === "display_data") {
    const content = message.content as DisplayDataContent;
    outputs = [
      ...outputs,
      {
        output_type: "display_data",
        data: asMime(content.data),
        metadata: content.metadata ?? {},
      },
    ];
  }

  if (message.channel === "iopub" && message.header.msg_type === "execute_result") {
    const content = message.content as ExecuteResultContent;
    if (typeof content.execution_count === "number") {
      executionCount = content.execution_count;
    }
    outputs = [
      ...outputs,
      {
        output_type: "execute_result",
        execution_count: typeof content.execution_count === "number" ? content.execution_count : 0,
        data: asMime(content.data),
        metadata: content.metadata ?? {},
      },
    ];
  }

  if (message.channel === "iopub" && message.header.msg_type === "error") {
    const content = message.content as ErrorContent;
    nextCursor.failed = true;
    outputs = [
      ...outputs,
      {
        output_type: "error",
        ename: textField(content.ename, "Error"),
        evalue: textField(content.evalue, ""),
        traceback: stringList(content.traceback),
      },
    ];
  }

  if (message.channel === "shell" && message.header.msg_type === "execute_reply") {
    const content = message.content as ExecuteReplyContent;
    nextCursor.sawReply = true;
    if (typeof content.execution_count === "number") {
      executionCount = content.execution_count;
    }
    if (content.status === "error" || content.status === "abort") {
      nextCursor.failed = true;
      const already = outputs.some((output) => output.output_type === "error");
      if (!already) {
        outputs = [
          ...outputs,
          {
            output_type: "error",
            ename: content.status === "error" ? textField(content.ename, "Error") : "Abort",
            evalue: content.status === "error" ? textField(content.evalue, "") : "Execution aborted",
            traceback: content.status === "error" ? stringList(content.traceback) : [],
          },
        ];
      }
    }
  }

  nextCursor.state = settle(nextCursor);

  return {
    cell: { ...cell, outputs, execution_count: executionCount },
    cursor: nextCursor,
  };
}
