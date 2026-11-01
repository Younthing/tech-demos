import { describe, expect, test } from "bun:test";
import type { KernelMessage } from "./messages";
import { createMockKernelSession } from "./mockKernel";
import { SAMPLE_HTML_SOURCE } from "./sampleNotebook";

async function collect(code: string, session = createMockKernelSession()) {
  const messages: KernelMessage[] = [];
  for await (const message of session.execute(code)) messages.push(message);
  return messages;
}

function content<T>(messages: KernelMessage[], msgType: string): T {
  const message = messages.find((item) => item.header.msg_type === msgType);
  if (!message) throw new Error(`missing ${msgType}`);
  return message.content as T;
}

describe("mock kernel", () => {
  test("prints, returns a value, and keeps the namespace", async () => {
    const session = createMockKernelSession();
    const printed = await collect(
      'name = "storybook"\nprint("hello from", name)',
      session,
    );
    expect(printed.map((message) => message.header.msg_type)).toEqual([
      "status",
      "stream",
      "execute_reply",
      "status",
    ]);
    expect(content<{ text: string }>(printed, "stream").text).toBe("hello from storybook\n");
    expect(content<{ status: string; execution_count: number }>(printed, "execute_reply")).toMatchObject({
      status: "ok",
      execution_count: 1,
    });
    expect(printed.at(-1)?.content).toEqual({ execution_state: "idle" });

    const result = await collect("name", session);
    expect(content<{ data: Record<string, string> }>(result, "execute_result").data["text/plain"]).toBe(
      "'storybook'",
    );
    expect(content<{ execution_count: number }>(result, "execute_reply").execution_count).toBe(2);
  });

  test("returns arithmetic and rich html, including a call split across lines", async () => {
    const session = createMockKernelSession();
    const math = await collect("2 + 40", session);
    expect(content<{ data: Record<string, string> }>(math, "execute_result").data).toEqual({
      "text/plain": "42",
    });
    const html = await collect(`display_html('<b>hi</b>')`, session);
    expect(content<{ data: Record<string, string> }>(html, "display_data").data["text/html"]).toBe(
      "<b>hi</b>",
    );
    const table = await collect(SAMPLE_HTML_SOURCE, session);
    expect(content<{ data: Record<string, string> }>(table, "display_data").data["text/html"]).toContain(
      "<th>Channel</th>",
    );
  });

  test("emits an error output and an error reply", async () => {
    const messages = await collect("print(undefined_name)");
    expect(content<{ ename: string }>(messages, "error").ename).toBe("NameError");
    expect(content<{ status: string }>(messages, "execute_reply").status).toBe("error");
    expect(messages.at(-1)?.header.msg_type).toBe("status");
  });

  test("keeps stdout that already ran before a raise", async () => {
    const messages = await collect('print("hello")\nraise ValueError("stop")');
    expect(content<{ text: string }>(messages, "stream").text).toBe("hello\n");
    expect(content<{ ename: string }>(messages, "error").ename).toBe("ValueError");
  });

  test("turns a syntax error into an error reply", async () => {
    const messages = await collect(`print("no end)`);
    expect(content<{ ename: string }>(messages, "error").ename).toBe("SyntaxError");
  });
});
