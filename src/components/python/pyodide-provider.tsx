"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { PyPackage } from "@/lib/content";
import {
  PYODIDE_INDEX_URL,
  PYODIDE_WORKER_URL,
  phaseLabel,
  readPalette,
  type DatasetFile,
  type RuntimePhase,
  type WorkerRequest,
  type WorkerResponse,
} from "@/lib/python-runtime";

export type RuntimeStatus = "off" | "starting" | "ready" | "error";

export type RunOutcome = {
  repr: string | null;
  error: string | null;
  images: string[];
};

export type RunOptions = {
  code: string;
  packages: PyPackage[];
  datasets: string[];
  onStream?: (stream: "stdout" | "stderr", text: string) => void;
};

type PendingRun = {
  resolve: (outcome: RunOutcome) => void;
  onStream?: (stream: "stdout" | "stderr", text: string) => void;
};

type PyodideContextValue = {
  status: RuntimeStatus;
  phase: RuntimePhase;
  phaseDetail: string;
  error: string | null;
  /** Cells currently executing, so the UI can disable every Run button at once. */
  busy: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  run: (options: RunOptions) => Promise<RunOutcome>;
};

const PyodideContext = createContext<PyodideContextValue | null>(null);

const datasetCache = new Map<string, Promise<DatasetFile>>();

function fetchDataset(name: string): Promise<DatasetFile> {
  const cached = datasetCache.get(name);
  if (cached) return cached;

  const request = fetch(`/datasets/${name}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load dataset "${name}" (HTTP ${response.status}).`);
      }
      return { name, text: await response.text() };
    })
    .catch((error) => {
      datasetCache.delete(name);
      throw error;
    });

  datasetCache.set(name, request);
  return request;
}

export function PyodideProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [status, setStatus] = useState<RuntimeStatus>("off");
  const [phase, setPhase] = useState<RuntimePhase>("idle");
  const [phaseDetail, setPhaseDetail] = useState<string>("Ready");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef<{ resolve: () => void; reject: (reason: Error) => void } | null>(null);
  const pendingRef = useRef(new Map<string, PendingRun>());
  const runCounter = useRef(0);

  const teardown = useCallback((reason: string) => {
    workerRef.current?.terminate();
    workerRef.current = null;

    for (const pending of pendingRef.current.values()) {
      pending.resolve({ repr: null, error: reason, images: [] });
    }
    pendingRef.current.clear();

    readyRef.current?.reject(new Error(reason));
    readyRef.current = null;

    setBusy(false);
    setPhase("idle");
    setPhaseDetail("Ready");
  }, []);

  const ensureWorker = useCallback((): Promise<Worker> => {
    if (workerRef.current && status === "ready") {
      return Promise.resolve(workerRef.current);
    }

    if (workerRef.current && readyRef.current) {
      const existing = workerRef.current;
      const pendingReady = readyRef.current;
      return new Promise((resolve, reject) => {
        const previous = pendingReady.resolve;
        pendingReady.resolve = () => {
          previous();
          resolve(existing);
        };
        pendingReady.reject = reject;
      });
    }

    const worker = new Worker(PYODIDE_WORKER_URL);
    workerRef.current = worker;
    setStatus("starting");
    setError(null);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      switch (message.type) {
        case "status": {
          setPhase(message.phase);
          setPhaseDetail(phaseLabel(message.phase, message.detail));
          break;
        }
        case "ready": {
          setStatus("ready");
          setPhase("idle");
          setPhaseDetail("Ready");
          readyRef.current?.resolve();
          readyRef.current = null;
          break;
        }
        case "stream": {
          if (!message.id) break;
          pendingRef.current.get(message.id)?.onStream?.(message.stream, message.text);
          break;
        }
        case "result": {
          const pending = pendingRef.current.get(message.id);
          pendingRef.current.delete(message.id);
          setBusy(pendingRef.current.size > 0);
          pending?.resolve({
            repr: message.repr,
            error: message.error,
            images: message.images,
          });
          break;
        }
        case "fatal": {
          setStatus("error");
          setError(message.error);
          teardown(message.error);
          break;
        }
        default:
          break;
      }
    };

    worker.onerror = (event) => {
      const reason = event.message || "The Python runtime worker crashed.";
      setStatus("error");
      setError(reason);
      teardown(reason);
    };

    const readyPromise = new Promise<Worker>((resolve, reject) => {
      readyRef.current = {
        resolve: () => resolve(worker),
        reject,
      };
    });

    const request: WorkerRequest = {
      type: "init",
      indexURL: PYODIDE_INDEX_URL,
      palette: readPalette(),
    };
    worker.postMessage(request);

    return readyPromise;
  }, [status, teardown]);

  const start = useCallback(() => {
    void ensureWorker().catch((cause: Error) => {
      setStatus("error");
      setError(cause.message);
    });
  }, [ensureWorker]);

  const stop = useCallback(() => {
    if (!workerRef.current) return;
    teardown("Stopped.");
    setStatus("off");
  }, [teardown]);

  const reset = useCallback(() => {
    if (!workerRef.current) return;
    const request: WorkerRequest = { type: "reset" };
    workerRef.current.postMessage(request);
  }, []);

  const run = useCallback(
    async ({ code, packages, datasets, onStream }: RunOptions): Promise<RunOutcome> => {
      let worker: Worker;
      try {
        worker = await ensureWorker();
      } catch (cause) {
        return {
          repr: null,
          images: [],
          error: cause instanceof Error ? cause.message : String(cause),
        };
      }

      let files: DatasetFile[];
      try {
        files = await Promise.all(datasets.map(fetchDataset));
      } catch (cause) {
        return {
          repr: null,
          images: [],
          error: cause instanceof Error ? cause.message : String(cause),
        };
      }

      runCounter.current += 1;
      const id = `run-${runCounter.current}`;

      const outcome = new Promise<RunOutcome>((resolve) => {
        pendingRef.current.set(id, { resolve, onStream });
      });
      setBusy(true);

      const request: WorkerRequest = {
        type: "run",
        id,
        code,
        packages,
        datasets: files,
        palette: readPalette(),
      };
      worker.postMessage(request);

      return outcome;
    },
    [ensureWorker],
  );

  // Keep matplotlib's colours in step with the page theme.
  useEffect(() => {
    if (status !== "ready" || !workerRef.current) return;
    const request: WorkerRequest = { type: "theme", palette: readPalette() };
    workerRef.current.postMessage(request);
  }, [resolvedTheme, status]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const value = useMemo<PyodideContextValue>(
    () => ({ status, phase, phaseDetail, error, busy, start, stop, reset, run }),
    [status, phase, phaseDetail, error, busy, start, stop, reset, run],
  );

  return <PyodideContext.Provider value={value}>{children}</PyodideContext.Provider>;
}

export function usePyodide(): PyodideContextValue {
  const context = useContext(PyodideContext);
  if (!context) {
    throw new Error("usePyodide must be used inside a <PyodideProvider>.");
  }
  return context;
}
