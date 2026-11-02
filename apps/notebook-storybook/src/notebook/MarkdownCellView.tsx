import { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { MarkdownCell } from "./model";

export function MarkdownCellView({
  cell,
  index,
  selected,
  onSelect,
  onSourceChange,
}: {
  cell: MarkdownCell;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onSourceChange: (source: string) => void;
}) {
  const [editing, setEditing] = useState(cell.source.length === 0);
  const fieldId = useId();
  const labelId = `${cell.id}-label`;
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  return (
    <article
      aria-labelledby={labelId}
      className={selected ? "cell selected" : "cell"}
      tabIndex={editing ? -1 : 0}
      onMouseDown={onSelect}
      onFocus={onSelect}
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (!editing && event.key === "Enter") {
          event.preventDefault();
          setEditing(true);
        }
      }}
    >
      <h2 id={labelId} className="sr-only">
        Markdown cell {index + 1}
      </h2>
      <div className="cell-input">
        <div className="gutter" />
        {editing ? (
          <textarea
            ref={areaRef}
            id={fieldId}
            className="markdown-editor"
            aria-label={`Markdown source for cell ${index + 1}`}
            value={cell.source}
            spellCheck
            onChange={(event) => onSourceChange(event.target.value)}
            onBlur={() => {
              if (cell.source.length > 0) setEditing(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" || ((event.metaKey || event.ctrlKey) && event.key === "Enter")) {
                event.preventDefault();
                if (cell.source.length > 0) setEditing(false);
              }
            }}
          />
        ) : (
          <div className="notebook-markdown">
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
      </div>
    </article>
  );
}
