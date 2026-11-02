/**
 * Notebook document shaped like nbformat 4.5 and the cell vscode-jupyter
 * executes: id, cell_type, source, outputs, execution_count, metadata.
 * Execution state is not stored on the cell. VS Code tracks that separately
 * (Idle / Pending / Executing); this UI maps it to idle / busy / success / error.
 */

export type ExecutionState = "idle" | "busy" | "success" | "error";

export type CellMetadata = Record<string, unknown>;

export type MimeBundle = Record<string, string>;

export type StreamOutput = {
  output_type: "stream";
  name: "stdout" | "stderr";
  text: string;
};

export type DisplayDataOutput = {
  output_type: "display_data";
  data: MimeBundle;
  metadata: CellMetadata;
};

export type ExecuteResultOutput = {
  output_type: "execute_result";
  execution_count: number;
  data: MimeBundle;
  metadata: CellMetadata;
};

export type ErrorOutput = {
  output_type: "error";
  ename: string;
  evalue: string;
  traceback: string[];
};

export type NotebookOutput =
  | StreamOutput
  | DisplayDataOutput
  | ExecuteResultOutput
  | ErrorOutput;

export type CodeCell = {
  id: string;
  cell_type: "code";
  source: string;
  outputs: NotebookOutput[];
  execution_count: number | null;
  metadata: CellMetadata;
};

export type MarkdownCell = {
  id: string;
  cell_type: "markdown";
  source: string;
  metadata: CellMetadata;
};

export type NotebookCell = CodeCell | MarkdownCell;

export type NotebookDocument = {
  nbformat: 4;
  nbformat_minor: 5;
  metadata: CellMetadata;
  cells: NotebookCell[];
};

export function isCodeCell(cell: NotebookCell): cell is CodeCell {
  return cell.cell_type === "code";
}

export function sourceToNbformat(source: string): string[] {
  if (source.length === 0) return [];
  const lines = source.split("\n");
  const formatted = lines.map((line, index) =>
    index < lines.length - 1 ? `${line}\n` : line,
  );
  if (formatted[formatted.length - 1] === "") formatted.pop();
  return formatted;
}

export function sourceFromNbformat(source: string | string[]): string {
  return Array.isArray(source) ? source.join("") : source;
}

type LooseOutput = {
  output_type?: string;
  name?: string;
  text?: string | string[];
  data?: Record<string, string | string[]>;
  metadata?: CellMetadata;
  execution_count?: number | null;
  ename?: string;
  evalue?: string;
  traceback?: string[];
};

type LooseCell = {
  id?: string;
  cell_type?: string;
  source?: string | string[];
  outputs?: LooseOutput[];
  execution_count?: number | null;
  metadata?: CellMetadata;
};

function joinText(text: string | string[] | undefined): string {
  if (Array.isArray(text)) return text.join("");
  return text ?? "";
}

function mimeFromLoose(data: Record<string, string | string[]> | undefined): MimeBundle {
  const bundle: MimeBundle = {};
  if (!data) return bundle;
  for (const [key, value] of Object.entries(data)) {
    bundle[key] = joinText(value);
  }
  return bundle;
}

function outputFromLoose(output: LooseOutput): NotebookOutput {
  if (output.output_type === "stream") {
    return {
      output_type: "stream",
      name: output.name === "stderr" ? "stderr" : "stdout",
      text: joinText(output.text),
    };
  }
  if (output.output_type === "execute_result") {
    return {
      output_type: "execute_result",
      execution_count: output.execution_count ?? 0,
      data: mimeFromLoose(output.data),
      metadata: output.metadata ?? {},
    };
  }
  if (output.output_type === "error") {
    return {
      output_type: "error",
      ename: output.ename ?? "Error",
      evalue: output.evalue ?? "",
      traceback: output.traceback ?? [],
    };
  }
  return {
    output_type: "display_data",
    data: mimeFromLoose(output.data),
    metadata: output.metadata ?? {},
  };
}

export type NbformatMarkdownCell = {
  id: string;
  cell_type: "markdown";
  source: string[];
  metadata: CellMetadata;
};

export type NbformatCodeCell = {
  id: string;
  cell_type: "code";
  source: string[];
  outputs: NotebookOutput[];
  execution_count: number | null;
  metadata: CellMetadata;
};

/** On-disk nbformat shape. `source` is a list of lines, not one string. */
export type NbformatNotebook = {
  nbformat: 4;
  nbformat_minor: 5;
  metadata: CellMetadata;
  cells: Array<NbformatMarkdownCell | NbformatCodeCell>;
};

export function toNbformat(document: NotebookDocument): NbformatNotebook {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: document.metadata,
    cells: document.cells.map((cell) => {
      const source = sourceToNbformat(cell.source);
      if (cell.cell_type === "markdown") {
        return {
          id: cell.id,
          cell_type: "markdown" as const,
          source,
          metadata: cell.metadata,
        };
      }
      return {
        id: cell.id,
        cell_type: "code" as const,
        source,
        outputs: cell.outputs,
        execution_count: cell.execution_count,
        metadata: cell.metadata,
      };
    }),
  };
}

/**
 * nbformat on disk stores `source` as a string or an array of lines.
 * The in-memory cell always uses one string.
 */
export function fromNbformat(input: {
  metadata?: CellMetadata;
  cells?: LooseCell[];
}): NotebookDocument {
  const cells = (input.cells ?? []).map((cell): NotebookCell => {
    const id = cell.id && cell.id.length > 0 ? cell.id : crypto.randomUUID();
    const metadata = cell.metadata ?? {};
    const source = sourceFromNbformat(cell.source ?? "");
    if (cell.cell_type === "markdown") {
      return { id, cell_type: "markdown", source, metadata };
    }
    if (cell.cell_type === "code") {
      return {
        id,
        cell_type: "code",
        source,
        metadata,
        outputs: (cell.outputs ?? []).map(outputFromLoose),
        execution_count:
          typeof cell.execution_count === "number" ? cell.execution_count : null,
      };
    }
    throw new Error(`Unsupported cell_type "${cell.cell_type ?? ""}"`);
  });

  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: input.metadata ?? {},
    cells,
  };
}

export function updateCellSource(
  document: NotebookDocument,
  cellId: string,
  source: string,
): NotebookDocument {
  return {
    ...document,
    cells: document.cells.map((cell) =>
      cell.id === cellId ? { ...cell, source } : cell,
    ),
  };
}

export function updateCodeCell(
  document: NotebookDocument,
  cellId: string,
  recipe: (cell: CodeCell) => CodeCell,
): NotebookDocument {
  return {
    ...document,
    cells: document.cells.map((cell) =>
      cell.id === cellId && cell.cell_type === "code" ? recipe(cell) : cell,
    ),
  };
}
