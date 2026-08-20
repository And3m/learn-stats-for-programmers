"use client";

import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { useMemo } from "react";

/**
 * Thin wrapper over CodeMirror. Loaded through `next/dynamic` by
 * `python-cell.tsx` so the editor never lands in the initial bundle.
 */
export default function CodeEditor({
  value,
  onChange,
  onRun,
  readOnly = false,
}: {
  value: string;
  onChange: (next: string) => void;
  onRun: () => void;
  readOnly?: boolean;
}) {
  const { resolvedTheme } = useTheme();

  const extensions = useMemo(
    () => [
      python(),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: "0.8125rem", backgroundColor: "transparent" },
        ".cm-content": { fontFamily: "var(--font-mono)", padding: "0.85rem 0" },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "var(--faint)",
          fontFamily: "var(--font-mono)",
        },
        ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },
        "&.cm-focused": { outline: "none" },
      }),
      // Ctrl/Cmd+Enter runs, the convention every notebook uses.
      EditorView.domEventHandlers({
        keydown: (event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onRun();
            return true;
          }
          return false;
        },
      }),
    ],
    [onRun],
  );

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      editable={!readOnly}
      readOnly={readOnly}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
        autocompletion: false,
        searchKeymap: false,
      }}
    />
  );
}
