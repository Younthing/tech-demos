import { useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MarkdownCell } from "./model";

export function MarkdownCellView({
  cell,
  index,
  onSourceChange,
}: {
  cell: MarkdownCell;
  index: number;
  onSourceChange: (source: string) => void;
}) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const fieldId = useId();
  const labelId = `${cell.id}-label`;

  return (
    <article aria-labelledby={labelId} className="border border-border bg-card px-4 py-4">
      <h2 id={labelId} className="sr-only">
        Markdown cell {index + 1}
      </h2>
      <div role="group" aria-label={`Markdown cell ${index + 1} mode`} className="mb-4 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="min-h-11"
          variant={mode === "preview" ? "default" : "outline"}
          aria-pressed={mode === "preview"}
          onClick={() => setMode("preview")}
        >
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          className="min-h-11"
          variant={mode === "edit" ? "default" : "outline"}
          aria-pressed={mode === "edit"}
          onClick={() => setMode("edit")}
        >
          Edit
        </Button>
      </div>
      {mode === "edit" ? (
        <>
          <label
            htmlFor={fieldId}
            className="mb-2 block text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase"
          >
            Markdown source
          </label>
          <Textarea
            id={fieldId}
            value={cell.source}
            spellCheck
            onChange={(event) => onSourceChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                setMode("preview");
              }
            }}
          />
        </>
      ) : (
        <div className="notebook-markdown text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h2>{children}</h2>,
              h2: ({ children }) => <h2>{children}</h2>,
              h3: ({ children }) => <h3>{children}</h3>,
            }}
          >
            {cell.source}
          </ReactMarkdown>
        </div>
      )}
    </article>
  );
}
