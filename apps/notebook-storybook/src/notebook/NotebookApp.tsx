import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  type NotebookDocument,
} from "./model";
import { ExecutionMark } from "./ExecutionMark";
import { createSampleNotebook } from "./sampleNotebook";

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
  const [generation, setGeneration] = useState(0);
  const sessionRef = useRef<KernelSession>(session ?? createMockKernelSession({ delayMs }));
  const runningRef = useRef<string | null>(null);
  const documentRef = useRef(document);
  const generationRef = useRef(0);

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  function reset() {
    generationRef.current += 1;
    runningRef.current = null;
    sessionRef.current.interrupt?.();
    sessionRef.current = session ?? createMockKernelSession({ delayMs });
    setGeneration((value) => value + 1);
    setDocument(initialDocument ?? createSampleNotebook());
    setExecutionStates({});
    setRunningCellId(null);
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

  const kernelState: ExecutionState = runningCellId ? "busy" : "idle";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-3xl flex-col px-5 py-10 sm:px-8">
        <header>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
                Storybook kernel
              </p>
              <h1 className="mt-2 font-heading text-3xl text-balance sm:text-4xl">Notebook</h1>
            </div>
            <Button type="button" variant="outline" className="min-h-11" onClick={reset}>
              Reset
            </Button>
          </div>
          <p className="mt-4 max-w-xl text-sm text-pretty text-muted-foreground">
            Run a code cell to send an execute_request. The mock kernel replies on the
            shell and iopub channels. Ctrl+Enter or Cmd+Enter runs the focused code cell.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <p>
              <span className="sr-only">Kernel status</span>
              <ExecutionMark state={kernelState} />
            </p>
            <Badge variant="secondary">{session?.label ?? "Mock kernel"}</Badge>
          </div>
        </header>
        <Separator className="my-8" />
        <ol className="flex list-none flex-col gap-8 p-0">
          {document.cells.map((cell, index) => (
            <li key={`${cell.id}-${generation}`}>
              {cell.cell_type === "markdown" ? (
                <MarkdownCellView
                  cell={cell}
                  index={index}
                  onSourceChange={(source) => changeSource(cell.id, source)}
                />
              ) : (
                <CodeCellView
                  cell={cell}
                  index={index}
                  executionState={executionStates[cell.id] ?? "idle"}
                  runDisabled={runningCellId !== null}
                  onSourceChange={(source) => changeSource(cell.id, source)}
                  onRun={() => void runCell(cell.id)}
                />
              )}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
