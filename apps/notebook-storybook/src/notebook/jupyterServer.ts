import {
  createExecuteRequest,
  parentMessageId,
  type KernelMessage,
  type StatusContent,
} from "./messages";
import type { KernelSession } from "./mockKernel";

/**
 * Jupyter Server kernel channels.
 *
 * The server multiplexes ZeroMQ channels onto one WebSocket at
 * `/api/kernels/<kernel_id>/channels`. Messages without binary buffers are
 * JSON text. Messages with buffers use the default big-endian offset frame
 * from `jupyter_server.services.kernels.connection.base.serialize_binary_message`.
 * The v1 subprotocol is not implemented.
 *
 * Storybook does not open this socket. Pass a kernel id that Jupyter Server
 * has already started; this adapter does not call the REST kernel API.
 */

export type KernelTransport = {
  readonly ready: Promise<void>;
  send(data: string | Uint8Array): void;
  close(): void;
  setHandler(handler: (data: string | ArrayBuffer | Uint8Array) => void): void;
  setCloseHandler?(handler: () => void): void;
};

export function jupyterChannelsUrl(options: {
  baseUrl: string;
  kernelId: string;
  sessionId: string;
  token?: string;
}): string {
  const base = new URL(options.baseUrl);
  const protocol = base.protocol === "https:" || base.protocol === "wss:" ? "wss:" : "ws:";
  const prefix = base.pathname.replace(/\/$/, "");
  const url = new URL(
    `${protocol}//${base.host}${prefix}/api/kernels/${encodeURIComponent(options.kernelId)}/channels`,
  );
  url.searchParams.set("session_id", options.sessionId);
  if (options.token) url.searchParams.set("token", options.token);
  return url.toString();
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    offset,
    false,
  );
}

function messageWithoutBuffers(message: KernelMessage): Omit<KernelMessage, "buffers"> {
  return {
    channel: message.channel,
    header: message.header,
    parent_header: message.parent_header,
    metadata: message.metadata,
    content: message.content,
  };
}

/** Default Jupyter Server WebSocket frame. Offsets are big-endian uint32. */
export function serializeBinaryMessage(message: KernelMessage): Uint8Array {
  const buffers = message.buffers ?? [];
  const json = new TextEncoder().encode(JSON.stringify(messageWithoutBuffers(message)));
  const parts = [json, ...buffers];
  const count = parts.length;
  const headerBytes = 4 * (count + 1);
  const offsets: number[] = [];
  let cursor = headerBytes;
  for (const part of parts) {
    offsets.push(cursor);
    cursor += part.byteLength;
  }
  const frame = new Uint8Array(cursor);
  const view = new DataView(frame.buffer);
  view.setUint32(0, count, false);
  offsets.forEach((offset, index) => {
    view.setUint32(4 * (index + 1), offset, false);
  });
  let writeAt = headerBytes;
  for (const part of parts) {
    frame.set(part, writeAt);
    writeAt += part.byteLength;
  }
  return frame;
}

export function deserializeBinaryMessage(bytes: Uint8Array): KernelMessage {
  if (bytes.byteLength < 8) throw new Error("Jupyter frame is too short");
  const count = readUint32(bytes, 0);
  if (count < 1) throw new Error("Jupyter frame has no message part");
  const headerBytes = 4 * (count + 1);
  if (bytes.byteLength < headerBytes) throw new Error("Jupyter frame header is truncated");
  const starts: number[] = [];
  for (let index = 0; index < count; index += 1) {
    starts.push(readUint32(bytes, 4 * (index + 1)));
  }
  const slices = starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : bytes.byteLength;
    if (start === undefined || end === undefined || start > end || end > bytes.byteLength) {
      throw new Error("Jupyter frame offsets are out of range");
    }
    return bytes.slice(start, end);
  });
  const json = new TextDecoder().decode(slices[0]);
  const message = JSON.parse(json) as KernelMessage;
  message.buffers = slices.slice(1);
  return message;
}

export function encodeWireMessage(message: KernelMessage): string | Uint8Array {
  if ((message.buffers?.length ?? 0) > 0) return serializeBinaryMessage(message);
  return JSON.stringify(messageWithoutBuffers(message));
}

export function decodeWireMessage(data: string | ArrayBuffer | Uint8Array): KernelMessage {
  if (typeof data === "string") {
    const message = JSON.parse(data) as KernelMessage;
    message.buffers = message.buffers ?? [];
    return message;
  }
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return deserializeBinaryMessage(bytes);
}

export function connectJupyterWebSocket(url: string): KernelTransport {
  const socket = new WebSocket(url);
  socket.binaryType = "arraybuffer";
  let handler: (data: string | ArrayBuffer | Uint8Array) => void = () => {};
  let onClose: () => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener(
      "error",
      () => reject(new Error("Jupyter Server WebSocket failed to open")),
      { once: true },
    );
  });
  socket.addEventListener("close", () => onClose());
  socket.addEventListener("message", (event: MessageEvent<string | ArrayBuffer>) => {
    handler(event.data);
  });
  return {
    ready,
    send(data) {
      if (typeof data === "string") {
        socket.send(data);
        return;
      }
      const copy = new ArrayBuffer(data.byteLength);
      new Uint8Array(copy).set(data);
      socket.send(copy);
    },
    close() {
      socket.close();
    },
    setHandler(next) {
      handler = next;
    },
    setCloseHandler(next) {
      onClose = next;
    },
  };
}

function isIdle(message: KernelMessage): boolean {
  if (message.channel !== "iopub" || message.header.msg_type !== "status") return false;
  return (message.content as StatusContent).execution_state === "idle";
}

export class JupyterServerKernelSession implements KernelSession {
  readonly kind = "jupyter-server" as const;
  readonly label = "Jupyter Server";
  readonly id: string;
  private transportPromise: Promise<KernelTransport> | null = null;
  private tail: Promise<void> = Promise.resolve();
  private readonly options: {
    baseUrl: string;
    kernelId: string;
    token?: string;
    sessionId?: string;
    transport?: KernelTransport;
    connect?: (url: string) => KernelTransport;
    timeoutMs?: number;
  };

  constructor(options: {
    baseUrl: string;
    kernelId: string;
    token?: string;
    sessionId?: string;
    transport?: KernelTransport;
    connect?: (url: string) => KernelTransport;
    timeoutMs?: number;
  }) {
    this.options = options;
    this.id = options.sessionId ?? crypto.randomUUID();
  }

  async *execute(code: string): AsyncGenerator<KernelMessage> {
    const release = await this.acquire();
    try {
      yield* this.run(code);
    } finally {
      release();
    }
  }

  close(): void {
    const pending = this.transportPromise;
    this.transportPromise = null;
    if (!pending || this.options.transport) return;
    void pending.then((transport) => transport.close()).catch(() => {});
  }

  private acquire(): Promise<() => void> {
    let release: () => void = () => {};
    const previous = this.tail;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    return previous.then(() => release);
  }

  private transport(): Promise<KernelTransport> {
    if (this.options.transport) return Promise.resolve(this.options.transport);
    if (!this.transportPromise) {
      const url = jupyterChannelsUrl({
        baseUrl: this.options.baseUrl,
        kernelId: this.options.kernelId,
        sessionId: this.id,
        token: this.options.token,
      });
      const connect = this.options.connect ?? connectJupyterWebSocket;
      const opened = connect(url);
      this.transportPromise = opened.ready.then(() => opened).catch((error: unknown) => {
        this.transportPromise = null;
        throw error;
      });
    }
    return this.transportPromise;
  }

  interrupt(): void {
    this.close();
  }

  private async *run(code: string): AsyncGenerator<KernelMessage> {
    const transport = await this.transport();
    const request = createExecuteRequest(code, this.id);
    const queue: KernelMessage[] = [];
    let sawReply = false;
    let sawIdle = false;
    let failure: Error | null = null;
    let wake: (() => void) | null = null;

    const finished = () => sawReply && sawIdle;

    transport.setHandler((data) => {
      try {
        const message = decodeWireMessage(data);
        if (parentMessageId(message) !== request.header.msg_id) return;
        queue.push(message);
        if (message.channel === "shell" && message.header.msg_type === "execute_reply") {
          sawReply = true;
        }
        if (isIdle(message)) sawIdle = true;
      } catch (error) {
        failure = error instanceof Error ? error : new Error("Malformed kernel message");
      }
      const notify = wake;
      wake = null;
      notify?.();
    });

    transport.setCloseHandler?.(() => {
      this.transportPromise = null;
      failure = new Error("Jupyter Server WebSocket closed");
      const notify = wake;
      wake = null;
      notify?.();
    });

    try {
      transport.send(encodeWireMessage(request));
      while (!finished()) {
        if (failure) throw failure;
        if (queue.length === 0) {
          const timeoutMs = this.options.timeoutMs ?? 30_000;
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              reject(new Error("Jupyter Server did not finish the execute request"));
            }, timeoutMs);
            wake = () => {
              clearTimeout(timer);
              resolve();
            };
          });
          continue;
        }
        while (queue.length > 0) {
          const message = queue.shift();
          if (message) yield message;
        }
      }
      while (queue.length > 0) {
        const message = queue.shift();
        if (message) yield message;
      }
    } finally {
      transport.setHandler(() => {});
      transport.setCloseHandler?.(() => {});
    }
  }
}

export function createJupyterServerSession(options: {
  baseUrl: string;
  kernelId: string;
  token?: string;
  sessionId?: string;
  transport?: KernelTransport;
  connect?: (url: string) => KernelTransport;
  timeoutMs?: number;
}): JupyterServerKernelSession {
  return new JupyterServerKernelSession(options);
}
