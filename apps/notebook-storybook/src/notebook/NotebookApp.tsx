import { useEffect, useRef, useState } from "react";
import { busyCursor, reduceExecution } from "./applyMessage";
import { CodeCellView } from "./CodeCellView";
import { MarkdownCellView } from "./MarkdownCellView";
import { createMockKernelSession, type KernelSession } from "./mockKernel";
import {
  isCodeCell,
  updateCellSource,
  updateCodeCell,
  type CodeCell,
  type ExecutionState,
  type NotebookCell,
  type NotebookDocument,
} from "./model";
import { createSampleNotebook } from "./sampleNotebook";
import "./notebook.css";

function blankCell(cellType: "code" | "markdown"): NotebookCell {
  const id = crypto.randomUUID();
  if (cellType === "markdown") {
    return { id, cell_type: "markdown", source: "", metadata: {} };
  }
  return {
    id,
    cell_type: "code",
    source: "",
    outputs: [],
    execution_count: null,
    metadata: {},
  };
}

export function NotebookApp({
  initialDocument,
  session,
  delayMs = 360,
}: {
  initialDocument?: NotebookDocument;
  session?: KernelSession;
  delayMs?: number;
}) {
  const [document, setDocument] = useState<NotebookDocument>(
    () => initialDocument ?? createSampleNotebook(),
  );
  const [executionStates, setExecutionStates] = useState<Record<string, ExecutionState>>({});
  const [runningCellId, setRunningCellId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (initialDocument ?? createSampleNotebook()).cells[0]?.id ?? null,
  );
  const sessionRef = useRef<KernelSession>(session ?? createMockKernelSession({ delayMs }));
  const runningRef = useRef<string | null>(null);
  const documentRef = useRef(document);
  const generationRef = useRef(0);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  function restart() {
    generationRef.current += 1;
    runningRef.current = null;
    sessionRef.current.interrupt?.();
    sessionRef.current = session ?? createMockKernelSession({ delayMs });
    setRunningCellId(null);
    setExecutionStates({});
    setDocument((current) => ({
      ...current,
      cells: current.cells.map((cell) =>
        cell.cell_type === "code" ? { ...cell, outputs: [], execution_count: null } : cell,
      ),
    }));
  }

  function insertCell(cellType: "code" | "markdown") {
    const cell = blankCell(cellType);
    setDocument((current) => {
      const index = current.cells.findIndex((item) => item.id === selectedId);
      const at = index === -1 ? current.cells.length : index + 1;
      const cells = [...current.cells];
      cells.splice(at, 0, cell);
      return { ...current, cells };
    });
    setSelectedId(cell.id);
  }

  function changeSource(cellId: string, source: string) {
    setDocument((current) => updateCellSource(current, cellId, source));
  }

  async function runCell(cellId: string) {
    if (runningRef.current) return;
    const cell = documentRef.current.cells.find((item) => item.id === cellId);
    if (!cell || !isCodeCell(cell)) return;
    const code = cell.source;
    const startedAt = generationRef.current;
    runningRef.current = cellId;
    setSelectedId(cellId);
    setRunningCellId(cellId);
    setExecutionStates((states) => ({ ...states, [cellId]: "busy" }));
    setDocument((current) =>
      updateCodeCell(current, cellId, (codeCell) => ({
        ...codeCell,
        outputs: [],
        execution_count: null,
      })),
    );

    let snapshot: CodeCell = { ...cell, outputs: [], execution_count: null };
    let cursor = busyCursor();
    const stillCurrent = () => generationRef.current === startedAt;

    try {
      for await (const message of sessionRef.current.execute(code)) {
        if (!stillCurrent()) return;
        const next = reduceExecution(snapshot, cursor, message);
        snapshot = next.cell;
        cursor = next.cursor;
        setDocument((current) =>
          updateCodeCell(current, cellId, (codeCell) => ({
            ...codeCell,
            outputs: snapshot.outputs,
            execution_count: snapshot.execution_count,
          })),
        );
        setExecutionStates((states) => ({ ...states, [cellId]: cursor.state }));
      }
    } catch (error) {
      if (!stillCurrent()) return;
      const message = error instanceof Error ? error.message : "Kernel session failed";
      setDocument((current) =>
        updateCodeCell(current, cellId, (codeCell) => ({
          ...codeCell,
          outputs: [
            ...codeCell.outputs,
            {
              output_type: "error",
              ename: "KernelError",
              evalue: message,
              traceback: [`KernelError: ${message}`],
            },
          ],
        })),
      );
      setExecutionStates((states) => ({ ...states, [cellId]: "error" }));
    } finally {
      if (stillCurrent()) {
        runningRef.current = null;
        setRunningCellId(null);
      }
    }
  }

  async function runAll() {
    const ids = documentRef.current.cells.filter(isCodeCell).map((cell) => cell.id);
    const startedAt = generationRef.current;
    for (const id of ids) {
      if (generationRef.current !== startedAt) return;
      await runCell(id);
    }
  }

  const busy = runningCellId !== null;
  const kernelName = session?.kind === "jupyter-server" ? "Jupyter Server" : "Python (mock)";

  return (
    <div className="notebook">
      <div className="notebook-toolbar" role="toolbar" aria-label="Notebook">
        <button type="button" onClick={() => insertCell("code")} disabled={busy}>
          + Code
        </button>
        <button type="button" onClick={() => insertCell("markdown")} disabled={busy}>
          + Markdown
        </button>
        <button type="button" onClick={() => void runAll()} disabled={busy}>
          Run All
        </button>
        <button type="button" onClick={restart} disabled={busy}>
          Restart
        </button>
        <span className="kernel">
          <span className={busy ? "kernel-dot busy" : "kernel-dot"} aria-hidden="true" />
          {kernelName}
          <span className="sr-only">{busy ? "Executing" : "Idle"}</span>
        </span>
      </div>
      <ol className="notebook-cells">
        {document.cells.map((cell, index) => (
          <li key={cell.id}>
            {cell.cell_type === "markdown" ? (
              <MarkdownCellView
                cell={cell}
                index={index}
                selected={selectedId === cell.id}
                onSelect={() => setSelectedId(cell.id)}
                onSourceChange={(source) => changeSource(cell.id, source)}
              />
            ) : (
              <CodeCellView
                cell={cell}
                index={index}
                executionState={executionStates[cell.id] ?? "idle"}
                selected={selectedId === cell.id}
                runDisabled={busy}
                onSelect={() => setSelectedId(cell.id)}
                onSourceChange={(source) => changeSource(cell.id, source)}
                onRun={() => void runCell(cell.id)}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
