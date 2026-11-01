import {
  createExecuteRequest,
  replyTo,
  type KernelMessage,
} from "./messages";

/**
 * In-memory kernel that emits Jupyter message shapes.
 * The language is a small Python-like subset (assignment, arithmetic,
 * print, display_html, raise). It is not CPython. The namespace lives
 * for the session, so a later cell can read an earlier assignment.
 */

export type KernelSession = {
  readonly id: string;
  readonly kind: "mock" | "jupyter-server";
  readonly label: string;
  execute(code: string): AsyncIterable<KernelMessage>;
  interrupt?(): void;
};

type Value = number | string;

type Expr =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "name"; value: string }
  | { type: "unary"; expr: Expr }
  | { type: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr }
  | { type: "call"; name: string; args: Expr[] };

type Stmt =
  | { type: "assign"; name: string; expr: Expr }
  | { type: "raise"; ename: string; message: Expr }
  | { type: "expr"; expr: Expr };

type Token =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "ident"; value: string }
  | { type: "op"; value: string }
  | { type: "newline" };

class KernelFailure extends Error {
  readonly ename: string;

  constructor(ename: string, message: string) {
    super(message);
    this.name = ename;
    this.ename = ename;
  }
}

type Effect =
  | { type: "stdout"; text: string }
  | { type: "display"; html: string }
  | { type: "result"; text: string };

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

function fail(ename: string, message: string): never {
  throw new KernelFailure(ename, message);
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index] ?? "";
    if (character === "\n" || character === ";") {
      tokens.push({ type: "newline" });
      index += 1;
      continue;
    }
    if (character === " " || character === "\t" || character === "\r") {
      index += 1;
      continue;
    }
    if (character === "#") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      const quote = character;
      index += 1;
      let value = "";
      let closed = false;
      while (index < source.length) {
        const current = source[index] ?? "";
        if (current === "\\") {
          const next = source[index + 1];
          if (next === undefined) fail("SyntaxError", "Unterminated escape");
          if (next === "n") value += "\n";
          else if (next === "t") value += "\t";
          else value += next;
          index += 2;
          continue;
        }
        if (current === quote) {
          closed = true;
          index += 1;
          break;
        }
        if (current === "\n") fail("SyntaxError", "Unterminated string");
        value += current;
        index += 1;
      }
      if (!closed) fail("SyntaxError", "Unterminated string");
      tokens.push({ type: "string", value });
      continue;
    }
    if (/[0-9]/.test(character)) {
      const start = index;
      index += 1;
      while (index < source.length && /[0-9]/.test(source[index] ?? "")) index += 1;
      if (source[index] === "." && /[0-9]/.test(source[index + 1] ?? "")) {
        index += 1;
        while (index < source.length && /[0-9]/.test(source[index] ?? "")) index += 1;
      }
      tokens.push({ type: "number", value: Number(source.slice(start, index)) });
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      const start = index;
      index += 1;
      while (index < source.length && /[A-Za-z0-9_]/.test(source[index] ?? "")) {
        index += 1;
      }
      tokens.push({ type: "ident", value: source.slice(start, index) });
      continue;
    }
    if ("+-*/=(),".includes(character)) {
      tokens.push({ type: "op", value: character });
      index += 1;
      continue;
    }
    fail("SyntaxError", `Unexpected character "${character}"`);
  }
  return tokens;
}

class Parser {
  private index = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    this.skipNewlines();
    while (!this.done()) {
      statements.push(this.statement());
      if (!this.done() && this.peek()?.type !== "newline") {
        fail("SyntaxError", "Expected a newline between statements");
      }
      this.skipNewlines();
    }
    return statements;
  }

  private done(): boolean {
    return this.index >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private peekAt(offset: number): Token | undefined {
    return this.tokens[this.index + offset];
  }

  private next(): Token {
    const token = this.peek();
    if (!token) fail("SyntaxError", "Unexpected end of code");
    this.index += 1;
    return token;
  }

  private skipNewlines(): void {
    while (this.peek()?.type === "newline") this.index += 1;
  }

  private peekOp(): string | null {
    const token = this.peek();
    return token?.type === "op" ? token.value : null;
  }

  private expectOp(value: string): void {
    const token = this.next();
    if (token.type !== "op" || token.value !== value) {
      fail("SyntaxError", `Expected "${value}"`);
    }
  }

  private expectIdent(): string {
    const token = this.next();
    if (token.type !== "ident") fail("SyntaxError", "Expected a name");
    return token.value;
  }

  private statement(): Stmt {
    const first = this.peek();
    if (first?.type === "ident" && first.value === "raise") {
      this.next();
      const ename = this.expectIdent();
      this.expectOp("(");
      const message = this.expression();
      this.expectOp(")");
      return { type: "raise", ename, message };
    }
    const second = this.peekAt(1);
    if (first?.type === "ident" && second?.type === "op" && second.value === "=") {
      const name = this.expectIdent();
      this.expectOp("=");
      return { type: "assign", name, expr: this.expression() };
    }
    return { type: "expr", expr: this.expression() };
  }

  private expression(): Expr {
    return this.binary(0);
  }

  private binary(minimum: number): Expr {
    let left = this.unary();
    while (true) {
      const operator = this.peekOp();
      const precedence =
        operator === "*" || operator === "/"
          ? 2
          : operator === "+" || operator === "-"
            ? 1
            : 0;
      if (!operator || precedence === 0 || precedence < minimum) break;
      if (operator !== "+" && operator !== "-" && operator !== "*" && operator !== "/") {
        break;
      }
      this.next();
      const right = this.binary(precedence + 1);
      left = { type: "binary", op: operator, left, right };
    }
    return left;
  }

  private unary(): Expr {
    if (this.peekOp() === "-") {
      this.next();
      return { type: "unary", expr: this.unary() };
    }
    return this.primary();
  }

  private primary(): Expr {
    const token = this.peek();
    if (!token || token.type === "newline") fail("SyntaxError", "Expected an expression");
    if (token.type === "number") {
      this.next();
      return { type: "number", value: token.value };
    }
    if (token.type === "string") {
      this.next();
      return { type: "string", value: token.value };
    }
    if (token.type === "ident") {
      const name = token.value;
      this.next();
      if (this.peekOp() === "(") {
        this.next();
        const args: Expr[] = [];
        if (this.peekOp() !== ")") {
          args.push(this.expression());
          while (this.peekOp() === ",") {
            this.next();
            args.push(this.expression());
          }
        }
        this.expectOp(")");
        return { type: "call", name, args };
      }
      return { type: "name", value: name };
    }
    if (token.type === "op" && token.value === "(") {
      this.next();
      const expression = this.expression();
      this.expectOp(")");
      return expression;
    }
    fail("SyntaxError", "Expected an expression");
  }
}

function repr(value: Value): string {
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function printed(value: Value): string {
  return String(value);
}

function evaluate(expression: Expr, env: Map<string, Value>): Value {
  switch (expression.type) {
    case "number":
    case "string":
      return expression.value;
    case "name": {
      const value = env.get(expression.value);
      if (value === undefined) {
        fail("NameError", `name '${expression.value}' is not defined`);
      }
      return value;
    }
    case "unary": {
      const value = evaluate(expression.expr, env);
      if (typeof value !== "number") {
        fail("TypeError", "bad operand type for unary -");
      }
      return -value;
    }
    case "binary": {
      const left = evaluate(expression.left, env);
      const right = evaluate(expression.right, env);
      if (expression.op === "+" && typeof left === "string" && typeof right === "string") {
        return left + right;
      }
      if (typeof left === "number" && typeof right === "number") {
        if (expression.op === "+") return left + right;
        if (expression.op === "-") return left - right;
        if (expression.op === "*") return left * right;
        if (right === 0 && expression.op === "/") fail("ZeroDivisionError", "division by zero");
        if (expression.op === "/") return left / right;
      }
      fail("TypeError", `unsupported operand type(s) for ${expression.op}`);
    }
    case "call":
      fail("TypeError", `${expression.name}() does not return a value`);
  }
}

function interpret(
  code: string,
  env: Map<string, Value>,
): { effects: Effect[]; failure: KernelFailure | null } {
  const effects: Effect[] = [];
  let result: string | null = null;
  let failure: KernelFailure | null = null;
  try {
    const statements = new Parser(tokenize(code)).parse();
    for (const statement of statements) {
    if (statement.type === "raise") {
      const message = evaluate(statement.message, env);
      if (typeof message !== "string") {
        fail("TypeError", "raise message must be a string");
      }
      fail(statement.ename, message);
    }
    if (statement.type === "assign") {
      if (statement.expr.type === "call") {
        fail("TypeError", `${statement.expr.name}() does not return a value`);
      }
      env.set(statement.name, evaluate(statement.expr, env));
      result = null;
      continue;
    }
    if (statement.expr.type === "call" && statement.expr.name === "print") {
      const parts = statement.expr.args.map((argument) => printed(evaluate(argument, env)));
      effects.push({ type: "stdout", text: `${parts.join(" ")}\n` });
      result = null;
      continue;
    }
    if (statement.expr.type === "call" && statement.expr.name === "display_html") {
      if (statement.expr.args.length !== 1) {
        fail("TypeError", "display_html() takes exactly one argument");
      }
      const html = evaluate(statement.expr.args[0] as Expr, env);
      if (typeof html !== "string") fail("TypeError", "display_html() expects a string");
      effects.push({ type: "display", html });
      result = null;
      continue;
    }
    if (statement.expr.type === "call") {
      fail("NameError", `name '${statement.expr.name}' is not defined`);
    }
    result = repr(evaluate(statement.expr, env));
    }
    if (result !== null) effects.push({ type: "result", text: result });
  } catch (error) {
    failure = kernelFailure(error);
  }
  return { effects, failure };
}

function kernelFailure(error: unknown): KernelFailure {
  if (error instanceof KernelFailure) return error;
  if (error instanceof Error) return new KernelFailure("KernelError", error.message);
  return new KernelFailure("KernelError", "Unknown kernel error");
}

export class MockKernelSession implements KernelSession {
  readonly kind = "mock" as const;
  readonly label = "Mock kernel";
  readonly id: string;
  private readonly env = new Map<string, Value>();
  private executionCount = 0;
  private tail: Promise<void> = Promise.resolve();
  private readonly delayMs: number;
  private epoch = 0;

  constructor(delayMs = 0) {
    this.delayMs = delayMs;
    this.id = crypto.randomUUID();
  }

  interrupt(): void {
    this.epoch += 1;
  }

  async *execute(code: string): AsyncGenerator<KernelMessage> {
    const release = await this.acquire();
    try {
      yield* this.run(code);
    } finally {
      release();
    }
  }

  private acquire(): Promise<() => void> {
    let release: () => void = () => {};
    const previous = this.tail;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    return previous.then(() => release);
  }

  private async *run(code: string): AsyncGenerator<KernelMessage> {
    const epoch = this.epoch;
    const request = createExecuteRequest(code, this.id);
    yield replyTo(request, "iopub", "status", { execution_state: "busy" });
    if (this.delayMs > 0) await wait(this.delayMs);
    if (this.epoch !== epoch) return;
    this.executionCount += 1;
    const executionCount = this.executionCount;
    const outcome = interpret(code, this.env);
    for (const effect of outcome.effects) {
      if (effect.type === "stdout") {
        yield replyTo(request, "iopub", "stream", {
          name: "stdout",
          text: effect.text,
        });
      } else if (effect.type === "display") {
        yield replyTo(request, "iopub", "display_data", {
          data: { "text/html": effect.html, "text/plain": "HTML" },
          metadata: {},
        });
      } else {
        yield replyTo(request, "iopub", "execute_result", {
          execution_count: executionCount,
          data: { "text/plain": effect.text },
          metadata: {},
        });
      }
    }
    if (outcome.failure) {
      const traceback = [`${outcome.failure.ename}: ${outcome.failure.message}`];
      yield replyTo(request, "iopub", "error", {
        ename: outcome.failure.ename,
        evalue: outcome.failure.message,
        traceback,
      });
      yield replyTo(request, "shell", "execute_reply", {
        status: "error",
        execution_count: executionCount,
        ename: outcome.failure.ename,
        evalue: outcome.failure.message,
        traceback,
      });
    } else {
      yield replyTo(request, "shell", "execute_reply", {
        status: "ok",
        execution_count: executionCount,
        user_expressions: {},
        payload: [],
      });
    }
    yield replyTo(request, "iopub", "status", { execution_state: "idle" });
  }
}

export function createMockKernelSession(options?: { delayMs?: number }): MockKernelSession {
  return new MockKernelSession(options?.delayMs ?? 0);
}
