import { CodeEditor } from "./CodeEditor";
import type { CodeCell, ExecutionState } from "./model";
import { OutputView } from "./OutputView";

function inPrompt(state: ExecutionState, executionCount: number | null): string {
  if (state === "busy") return "In [*]:";
  if (executionCount === null) return "In [ ]:";
  return `In [${executionCount}]:`;
}

function RunIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.2 1.6v8.8L10.2 6 3.2 1.6z" fill="currentColor" />
    </svg>
  );
}

export function CodeCellView({
  cell,
  index,
  executionState,
  selected,
  runDisabled,
  onSelect,
  onSourceChange,
  onRun,
}: {
  cell: CodeCell;
  index: number;
  executionState: ExecutionState;
  selected: boolean;
  runDisabled: boolean;
  onSelect: () => void;
  onSourceChange: (source: string) => void;
  onRun: () => void;
}) {
  const labelId = `${cell.id}-label`;
  const busy = executionState === "busy";
  const status =
    executionState === "busy" ? "Running" : executionState === "error" ? "Failed" : "";

  return (
    <article
      aria-labelledby={labelId}
      aria-busy={busy}
      className={selected ? "cell selected" : "cell"}
      data-state={executionState}
      onMouseDown={onSelect}
      onFocus={onSelect}
    >
      <h2 id={labelId} className="sr-only">
        Code cell {index + 1}
      </h2>
      {status ? (
        <span className="sr-only" role="status">
          {status}
        </span>
      ) : null}
      <div className="cell-input">
        <div className="gutter">
          <button
            type="button"
            className={busy ? "run-button busy" : "run-button"}
            aria-label={`Run cell ${index + 1}`}
            aria-disabled={runDisabled}
            onClick={() => {
              if (!runDisabled) onRun();
            }}
          >
            <RunIcon />
          </button>
          <span className="prompt in">{inPrompt(executionState, cell.execution_count)}</span>
        </div>
        <CodeEditor
          source={cell.source}
          labelId={labelId}
          editable={!busy}
          onChange={onSourceChange}
          onRun={onRun}
        />
      </div>
      <OutputView outputs={cell.outputs} label={`Output for code cell ${index + 1}`} />
    </article>
  );
}
