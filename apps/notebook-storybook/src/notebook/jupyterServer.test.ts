import { describe, expect, test } from "bun:test";
import { createExecuteRequest, replyTo, type KernelMessage } from "./messages";
import {
  createJupyterServerSession,
  decodeWireMessage,
  deserializeBinaryMessage,
  encodeWireMessage,
  jupyterChannelsUrl,
  serializeBinaryMessage,
  type KernelTransport,
} from "./jupyterServer";

async function collect(iterable: AsyncIterable<KernelMessage>) {
  const messages: KernelMessage[] = [];
  for await (const message of iterable) messages.push(message);
  return messages;
}

describe("jupyter server wire", () => {
  test("builds the channels websocket url", () => {
    expect(
      jupyterChannelsUrl({
        baseUrl: "https://example.com:8888/jupyter/",
        kernelId: "kid",
        sessionId: "sid",
        token: "tok",
      }),
    ).toBe(
      "wss://example.com:8888/jupyter/api/kernels/kid/channels?session_id=sid&token=tok",
    );
    expect(
      jupyterChannelsUrl({
        baseUrl: "http://127.0.0.1:8888",
        kernelId: "a/b",
        sessionId: "sid",
      }),
    ).toBe("ws://127.0.0.1:8888/api/kernels/a%2Fb/channels?session_id=sid");
    expect(
      jupyterChannelsUrl({
        baseUrl: "wss://example.com/lab",
        kernelId: "kid",
        sessionId: "sid",
      }),
    ).toBe("wss://example.com/lab/api/kernels/kid/channels?session_id=sid");
  });

  test("round-trips a binary frame with one buffer", () => {
    const message = createExecuteRequest("1 + 1", "session");
    message.buffers = [new Uint8Array([9, 8, 7])];
    const bytes = serializeBinaryMessage(message);
    expect(Array.from(bytes.slice(0, 4))).toEqual([0, 0, 0, 2]);
    const decoded = deserializeBinaryMessage(bytes);
    expect(decoded.header.msg_type).toBe("execute_request");
    expect(decoded.content).toEqual(message.content);
    expect(Array.from(decoded.buffers?.[0] ?? [])).toEqual([9, 8, 7]);
  });

  test("sends execute_request as json and stops after reply plus idle", async () => {
    const transport: KernelTransport = {
      ready: Promise.resolve(),
      sent: [] as Array<string | Uint8Array>,
      send(data) {
        this.sent.push(data);
        if (typeof data !== "string") throw new Error("expected a text frame");
        const request = decodeWireMessage(data);
        const scripted = [
          replyTo(request, "iopub", "status", { execution_state: "busy" }),
          replyTo(request, "iopub", "stream", { name: "stdout", text: "ok\n" }),
          replyTo(request, "shell", "execute_reply", {
            status: "ok",
            execution_count: 1,
            user_expressions: {},
            payload: [],
          }),
          replyTo(request, "iopub", "status", { execution_state: "idle" }),
        ];
        for (const message of scripted) this.handler(encodeWireMessage(message) as string);
      },
      close() {},
      handler: (_data: string | ArrayBuffer | Uint8Array) => {},
      setHandler(handler) {
        this.handler = handler;
      },
    };

    const session = createJupyterServerSession({
      baseUrl: "http://127.0.0.1:8888",
      kernelId: "kid",
      transport,
    });
    const messages = await collect(session.execute("print('ok')"));
    expect(messages.map((message) => message.header.msg_type)).toEqual([
      "status",
      "stream",
      "execute_reply",
      "status",
    ]);
    const sent = transport.sent[0];
    if (typeof sent !== "string") throw new Error("expected json");
    const request = decodeWireMessage(sent);
    expect(request.channel).toBe("shell");
    expect(request.header.msg_type).toBe("execute_request");
    expect(request.content).toMatchObject({ code: "print('ok')", allow_stdin: false });
  });

  test("times out when the kernel never goes idle", async () => {
    const transport: KernelTransport = {
      ready: Promise.resolve(),
      send() {},
      close() {},
      setHandler() {},
    };
    const session = createJupyterServerSession({
      baseUrl: "http://127.0.0.1:8888",
      kernelId: "kid",
      timeoutMs: 20,
      transport,
    });
    await expect(collect(session.execute("1"))).rejects.toThrow(/did not finish/);
  });
});
