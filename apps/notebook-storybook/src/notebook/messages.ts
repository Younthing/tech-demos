/**
 * Jupyter kernel messages, protocol 5.3.
 *
 * vscode-jupyter sends these through an IKernelSession. A Jupyter Server
 * session carries them on one WebSocket (shell, iopub, stdin, control,
 * heartbeat). A raw session uses ZeroMQ sockets instead. This demo speaks
 * the WebSocket shape only.
 *
 * A cell execution is finished only after the shell `execute_reply` and the
 * iopub `status` with `execution_state: "idle"` that share the request's
 * parent header. That is the same rule as CellExecutionMessageHandler
 * (`gotIdleIOPubStatus && gotShellReply`).
 */

export const JUPYTER_PROTOCOL_VERSION = "5.3";

export type Channel = "shell" | "iopub" | "stdin" | "control" | "heartbeat";

export type JupyterHeader = {
  msg_id: string;
  session: string;
  username: string;
  date: string;
  msg_type: string;
  version: typeof JUPYTER_PROTOCOL_VERSION;
};

export type KernelMessage<TContent = Record<string, unknown>> = {
  channel: Channel;
  header: JupyterHeader;
  parent_header: JupyterHeader | Record<string, never>;
  metadata: Record<string, unknown>;
  content: TContent;
  buffers?: Uint8Array[];
};

export type ExecuteRequestContent = {
  code: string;
  silent: boolean;
  store_history: boolean;
  user_expressions: Record<string, string>;
  allow_stdin: boolean;
  stop_on_error: boolean;
};

export type ExecuteReplyOk = {
  status: "ok";
  execution_count: number;
  user_expressions: Record<string, string>;
  payload: unknown[];
};

export type ExecuteReplyError = {
  status: "error";
  execution_count: number;
  ename: string;
  evalue: string;
  traceback: string[];
};

export type ExecuteReplyAbort = {
  status: "abort";
  execution_count: number | null;
};

export type ExecuteReplyContent =
  | ExecuteReplyOk
  | ExecuteReplyError
  | ExecuteReplyAbort;

export type StatusContent = {
  execution_state: "busy" | "idle" | "starting";
};

export type StreamContent = {
  name: "stdout" | "stderr";
  text: string;
};

export type DisplayDataContent = {
  data: Record<string, string>;
  metadata: Record<string, unknown>;
};

export type ExecuteResultContent = {
  execution_count: number;
  data: Record<string, string>;
  metadata: Record<string, unknown>;
};

export type ErrorContent = {
  ename: string;
  evalue: string;
  traceback: string[];
};

export function createMessage<TContent>(options: {
  channel: Channel;
  msgType: string;
  session: string;
  content: TContent;
  parent?: JupyterHeader;
  username?: string;
  metadata?: Record<string, unknown>;
}): KernelMessage<TContent> {
  return {
    channel: options.channel,
    header: {
      msg_id: crypto.randomUUID(),
      session: options.session,
      username: options.username ?? "notebook",
      date: new Date().toISOString(),
      msg_type: options.msgType,
      version: JUPYTER_PROTOCOL_VERSION,
    },
    parent_header: options.parent ?? {},
    metadata: options.metadata ?? {},
    content: options.content,
  };
}

export function createExecuteRequest(
  code: string,
  session: string,
): KernelMessage<ExecuteRequestContent> {
  return createMessage({
    channel: "shell",
    msgType: "execute_request",
    session,
    content: {
      code,
      silent: false,
      store_history: true,
      user_expressions: {},
      allow_stdin: false,
      stop_on_error: true,
    },
  });
}

export function parentMessageId(message: KernelMessage): string | null {
  const parent = message.parent_header;
  if (!parent || typeof parent !== "object") return null;
  if ("msg_id" in parent && typeof parent.msg_id === "string") {
    return parent.msg_id;
  }
  return null;
}

export function replyTo<TContent>(
  request: KernelMessage,
  channel: Channel,
  msgType: string,
  content: TContent,
): KernelMessage<TContent> {
  return createMessage({
    channel,
    msgType,
    session: request.header.session,
    username: request.header.username,
    parent: request.header,
    content,
  });
}
