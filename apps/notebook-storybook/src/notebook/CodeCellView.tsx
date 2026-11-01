import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "./CodeEditor";
import { ExecutionMark } from "./ExecutionMark";
import type { CodeCell, ExecutionState } from "./model";
import { OutputView } from "./OutputView";

function promptLabel(state: ExecutionState, executionCount: number | null): string {
  if (state === "busy") return "[*]";
  if (executionCount === null) return "[ ]";
  return `[${executionCount}]`;
}

export function CodeCellView({
  cell,
  index,
  executionState,
  runDisabled,
  onSourceChange,
  onRun,
}: {
  cell: CodeCell;
  index: number;
  executionState: ExecutionState;
  runDisabled: boolean;
  onSourceChange: (source: string) => void;
  onRun: () => void;
}) {
  const labelId = `${cell.id}-label`;
  const prompt = promptLabel(executionState, cell.execution_count);
  const busy = executionState === "busy";

  return (
    <article
      aria-labelledby={labelId}
      aria-busy={busy}
      className="border border-border bg-card focus-within:ring-2 focus-within:ring-ring/30"
      data-state={executionState}
    >
      <h2 id={labelId} className="sr-only">
        Code cell {index + 1}, {executionState}
      </h2>
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">In {prompt}</span>
          <ExecutionMark state={executionState} />
        </div>
        <Button
          type="button"
          size="sm"
          className="min-h-11 min-w-11 aria-disabled:opacity-50"
          aria-disabled={runDisabled}
          aria-label={`Run code cell ${index + 1}`}
          onClick={() => {
            if (!runDisabled) onRun();
          }}
        >
          <Play aria-hidden="true" className="translate-x-px" />
          Run
        </Button>
      </div>
      <CodeEditor
        source={cell.source}
        labelId={labelId}
        editable={!busy}
        onChange={onSourceChange}
        onRun={onRun}
      />
      <OutputView outputs={cell.outputs} label={`Output for code cell ${index + 1}`} />
    </article>
  );
}
