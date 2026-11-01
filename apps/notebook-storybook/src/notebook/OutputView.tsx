import type { NotebookOutput } from "./model";
import { sanitizeHtml } from "./sanitizeHtml";

function RichOrPlain({ data }: { data: Record<string, string> }) {
  const safeHtml = data["text/html"] ? sanitizeHtml(data["text/html"]) : "";
  if (safeHtml.length > 0) {
    return (
      <div
        className="notebook-html px-3.5 py-3"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }
  const plain = data["text/plain"] ?? "";
  if (plain.length === 0) return null;
  return (
    <pre className="px-3.5 py-3 font-mono text-[13px] whitespace-pre-wrap text-foreground">
      {plain}
    </pre>
  );
}

function OutputBlock({ output }: { output: NotebookOutput }) {
  if (output.output_type === "stream") {
    return (
      <pre
        className={
          output.name === "stderr"
            ? "px-3.5 py-3 font-mono text-[13px] whitespace-pre-wrap text-destructive"
            : "px-3.5 py-3 font-mono text-[13px] whitespace-pre-wrap text-foreground"
        }
      >
        {output.name === "stderr" ? `stderr: ${output.text}` : output.text}
      </pre>
    );
  }

  if (output.output_type === "error") {
    const text =
      output.traceback.length > 0
        ? output.traceback.join("\n")
        : `${output.ename}: ${output.evalue}`;
    return (
      <pre role="alert" className="border-l-2 border-destructive px-3.5 py-3 font-mono text-[13px] whitespace-pre-wrap text-destructive">
        {text}
      </pre>
    );
  }

  return (
    <div>
      <p className="px-3.5 pt-3 font-mono text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase tabular-nums">
        {output.output_type === "execute_result"
          ? `Out [${output.execution_count}]`
          : "Display"}
      </p>
      <RichOrPlain data={output.data} />
    </div>
  );
}

export function OutputView({
  outputs,
  label,
}: {
  outputs: NotebookOutput[];
  label: string;
}) {
  return (
    <div
      className={
        outputs.length === 0
          ? "sr-only"
          : "notebook-output border-t border-border animate-in fade-in duration-150"
      }
      role="region"
      aria-label={label}
      aria-live="polite"
    >
      {outputs.map((output, index) => (
        <OutputBlock key={`${output.output_type}-${index}`} output={output} />
      ))}
    </div>
  );
}
