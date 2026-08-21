"use client";

import { Play, RotateCcw, Square } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePyodide } from "@/components/python/pyodide-provider";
import { useLessonRuntime } from "@/components/python/lesson-runtime-context";
import type { PyPackage } from "@/lib/content";

const CodeEditor = dynamic(() => import("@/components/python/code-editor"), {
  ssr: false,
  loading: () => <pre className="python-cell__placeholder">Loading editor…</pre>,
});

type StreamLine = { stream: "stdout" | "stderr"; text: string };

export function PythonCell({
  children,
  code,
  label,
  packages,
  datasets,
}: {
  /** Source can be passed as a child template string or via `code`. */
  children?: string;
  code?: string;
  label?: string;
  packages?: PyPackage[];
  datasets?: string[];
}) {
  const source = (code ?? children ?? "").replace(/^\n/, "").replace(/\s+$/, "");
  const lessonRuntime = useLessonRuntime();
  const { run, status, busy, start, stop, phaseDetail } = usePyodide();

  const [value, setValue] = useState(source);
  const [lines, setLines] = useState<StreamLine[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [repr, setRepr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // The editor's Ctrl+Enter handler is memoised, so it must not close over a
  // changing `execute`. A ref keeps the latest source reachable without making
  // `execute` — and therefore the CodeMirror extensions — rebuild on every
  // keystroke.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Ctrl+Enter bypasses the Run button's `disabled`, so `execute` has to hold
  // the gate itself. Refs, not state, so the guard does not become a dependency
  // and rebuild the editor extensions.
  const runningRef = useRef(running);
  const busyRef = useRef(busy);
  useEffect(() => {
    runningRef.current = running;
    busyRef.current = busy;
  }, [running, busy]);

  const effectivePackages = packages ?? lessonRuntime.packages;
  const effectiveDatasets = datasets ?? lessonRuntime.datasets;

  const execute = useCallback(async () => {
    // A second concurrent run would overwrite the worker's `currentRunId` and
    // clear captured figures, so output would land in the wrong cell.
    if (runningRef.current || busyRef.current) return;

    setRunning(true);
    setHasRun(true);
    setLines([]);
    setImages([]);
    setRepr(null);
    setError(null);

    const outcome = await run({
      code: valueRef.current,
      packages: effectivePackages,
      datasets: effectiveDatasets,
      onStream: (stream, text) => setLines((current) => [...current, { stream, text }]),
    });

    setImages(outcome.images);
    setRepr(outcome.repr);
    setError(outcome.error);
    setRunning(false);
  }, [run, effectivePackages, effectiveDatasets]);

  const handleRun = useCallback(() => void execute(), [execute]);

  const reset = () => {
    setValue(source);
    setLines([]);
    setImages([]);
    setRepr(null);
    setError(null);
    setHasRun(false);
  };

  const showOutput = hasRun || running;
  const isOff = status === "off" || status === "error";

  return (
    <section className="python-cell" aria-label={label ?? "Runnable Python"}>
      <header className="python-cell__bar">
        <span className="python-cell__label">{label ?? "Python"}</span>
        <div className="python-cell__actions">
          {value !== source ? (
            <button type="button" className="python-cell__action" onClick={reset}>
              <RotateCcw size={13} aria-hidden /> Reset
            </button>
          ) : null}
          {running ? (
            <button type="button" className="python-cell__action" onClick={stop}>
              <Square size={13} aria-hidden /> Stop
            </button>
          ) : null}
          <button
            type="button"
            className="python-cell__action python-cell__action--run"
            onClick={isOff ? start : handleRun}
            disabled={running || (busy && !running)}
          >
            <Play size={13} aria-hidden />
            {isOff ? "Start Python" : running ? "Running…" : "Run"}
          </button>
        </div>
      </header>

      <div className="python-cell__editor">
        <CodeEditor value={value} onChange={setValue} onRun={handleRun} />
      </div>

      {status === "starting" ? <p className="python-cell__status">{phaseDetail}</p> : null}

      {showOutput ? (
        <div className="python-cell__output" aria-live="polite">
          {lines.length > 0 ? (
            <pre className="python-cell__stream">
              {lines.map((line, index) => (
                <span key={index} data-stream={line.stream}>
                  {line.text}
                  {"\n"}
                </span>
              ))}
            </pre>
          ) : null}

          {repr ? <pre className="python-cell__repr">{repr}</pre> : null}

          {images.map((data, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              className="python-cell__figure"
              src={`data:image/png;base64,${data}`}
              alt={`Figure ${index + 1} generated by the code above`}
            />
          ))}

          {error ? <pre className="python-cell__error">{error}</pre> : null}

          {running && lines.length === 0 && !error ? (
            <p className="python-cell__status">{phaseDetail}</p>
          ) : null}

          {!running && !error && lines.length === 0 && !repr && images.length === 0 ? (
            <p className="python-cell__status">Finished with no output.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
