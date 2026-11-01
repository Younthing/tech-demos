import type { NotebookOutput } from "./model";
import { sanitizeHtml } from "./sanitizeHtml";

function RichOrPlain({ data }: { data: Record<string, string> }) {
  const safeHtml = data["text/html"] ? sanitizeHtml(data["text/html"]) : "";
  if (safeHtml.length > 0) {
    return <div className="notebook-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  }
  const plain = data["text/plain"] ?? "";
  if (plain.length === 0) return null;
  return <pre className="output-plain">{plain}</pre>;
}

function OutputBody({ output }: { output: NotebookOutput }) {
  if (output.output_type === "stream") {
    const text = output.name === "stderr" ? `stderr: ${output.text}` : output.text;
    return <pre className={output.name === "stderr" ? "output-error" : "output-stream"}>{text}</pre>;
  }
  if (output.output_type === "error") {
    const text =
      output.traceback.length > 0
        ? output.traceback.join("\n")
        : `${output.ename}: ${output.evalue}`;
    return (
      <pre role="alert" className="output-error">
        {text}
      </pre>
    );
  }
  return <RichOrPlain data={output.data} />;
}

export function OutputView({
  outputs,
  label,
}: {
  outputs: NotebookOutput[];
  label: string;
}) {
  return (
    <div role="region" aria-label={label} aria-live="polite" className={outputs.length === 0 ? "sr-only" : undefined}>
      {outputs.map((output, index) => (
        <div className="output-row" key={`${output.output_type}-${index}`}>
          <div className="gutter">
            {output.output_type === "execute_result" ? (
              <span className="prompt out">Out[{output.execution_count}]:</span>
            ) : null}
          </div>
          <OutputBody output={output} />
        </div>
      ))}
    </div>
  );
}
