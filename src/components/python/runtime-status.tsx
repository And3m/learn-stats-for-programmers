"use client";

import { CircleCheck, CirclePlay, LoaderCircle, TriangleAlert } from "lucide-react";

import { usePyodide } from "@/components/python/pyodide-provider";
import { useLessonRuntime } from "@/components/python/lesson-runtime-context";
import { PYODIDE_VERSION } from "@/lib/python-runtime";

/**
 * The runtime banner shown once per lesson. Nothing downloads until the reader
 * asks for it — the interpreter plus this lesson's wheels can run to tens of
 * megabytes, which no one should pay for just to read prose.
 */
export function RuntimeStatus() {
  const { status, phaseDetail, error, start, stop, reset } = usePyodide();
  const { packages, datasets } = useLessonRuntime();

  if (packages.length === 0 && datasets.length === 0) return null;

  return (
    <div className="runtime-status" data-status={status}>
      <div className="runtime-status__icon" aria-hidden>
        {status === "ready" ? (
          <CircleCheck size={16} />
        ) : status === "starting" ? (
          <LoaderCircle size={16} className="runtime-status__spinner" />
        ) : status === "error" ? (
          <TriangleAlert size={16} />
        ) : (
          <CirclePlay size={16} />
        )}
      </div>

      <div className="runtime-status__body">
        <p className="runtime-status__headline">
          {status === "ready"
            ? `Python ready — CPython 3.14 via Pyodide ${PYODIDE_VERSION}`
            : status === "starting"
              ? phaseDetail
              : status === "error"
                ? (error ?? "The Python runtime failed to start.")
                : "This lesson runs real Python in your browser."}
        </p>
        <p className="runtime-status__detail">
          {packages.length > 0 ? (
            <>
              Needs {packages.join(", ")}
              {datasets.length > 0 ? ` and ${datasets.join(", ")}` : ""}. Downloaded once, on
              demand; nothing leaves your machine.
            </>
          ) : (
            <>Downloaded once, on demand; nothing leaves your machine.</>
          )}
        </p>
      </div>

      <div className="runtime-status__actions">
        {status === "ready" ? (
          <>
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Clear variables
            </button>
            <button type="button" className="btn btn--ghost" onClick={stop}>
              Shut down
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={start}
            disabled={status === "starting"}
          >
            {status === "starting" ? "Starting…" : status === "error" ? "Retry" : "Start Python"}
          </button>
        )}
      </div>
    </div>
  );
}
