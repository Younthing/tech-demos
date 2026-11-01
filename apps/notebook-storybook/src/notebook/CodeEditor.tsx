import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { useEffect, useRef } from "react";

const notebookTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "13.5px",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-mono), ui-monospace, monospace",
    lineHeight: "1.55",
  },
  ".cm-content": {
    padding: "12px 0",
    minHeight: "4.5rem",
    caretColor: "var(--foreground)",
  },
  ".cm-line": {
    padding: "0 14px",
  },
  ".cm-gutters": {
    display: "none",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--foreground)",
  },
});

export function CodeEditor({
  source,
  labelId,
  editable,
  onChange,
  onRun,
}: {
  source: string;
  labelId: string;
  editable: boolean;
  onChange: (source: string) => void;
  onRun: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableSlot = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const initialSource = useRef(source);
  const initialEditable = useRef(editable);
  const initialLabelId = useRef(labelId);
  const emittedSource = useRef(source);

  useEffect(() => {
    onChangeRef.current = onChange;
    onRunRef.current = onRun;
  }, [onChange, onRun]);

  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;
    const slot = new Compartment();
    editableSlot.current = slot;
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: initialSource.current,
        extensions: [
          python(),
          history(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            {
              key: "Mod-Enter",
              run: () => {
                onRunRef.current();
                return true;
              },
            },
          ]),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const next = update.state.doc.toString();
            emittedSource.current = next;
            onChangeRef.current(next);
          }),
          EditorView.contentAttributes.of({ "aria-labelledby": initialLabelId.current }),
          slot.of([
            EditorView.editable.of(initialEditable.current),
            EditorState.readOnly.of(!initialEditable.current),
          ]),
          EditorView.lineWrapping,
          notebookTheme,
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
      editableSlot.current = null;
    };
    // Mount once per cell. Later source and editable updates are synced below.
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || source === emittedSource.current) return;
    emittedSource.current = source;
    const current = view.state.doc.toString();
    if (current === source) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: source },
    });
  }, [source]);

  useEffect(() => {
    const view = viewRef.current;
    const slot = editableSlot.current;
    if (!view || !slot) return;
    view.dispatch({
      effects: slot.reconfigure([
        EditorView.editable.of(editable),
        EditorState.readOnly.of(!editable),
      ]),
    });
  }, [editable]);

  return <div ref={hostRef} className="overflow-hidden" />;
}
