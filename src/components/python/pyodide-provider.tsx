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
  PYODIDE_WORKER_OPTIONS,
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

/** One caller awaiting the current boot. */
type ReadyWaiter = {
  resolve: (worker: Worker) => void;
  reject: (reason: Error) => void;
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
  /**
   * Everyone awaiting the current boot. This has to be a queue: several cells
   * can call `run()` before the runtime is ready, and each needs its own
   * settlement. Keeping a single slot meant a second caller overwrote the
   * first one's `reject`, so a failed boot left that cell awaiting forever
   * with its Run button disabled.
   */
  const readyWaitersRef = useRef<ReadyWaiter[]>([]);
  const pendingRef = useRef(new Map<string, PendingRun>());
  const runCounter = useRef(0);

  const teardown = useCallback((reason: string) => {
    workerRef.current?.terminate();
    workerRef.current = null;

    for (const pending of pendingRef.current.values()) {
      pending.resolve({ repr: null, error: reason, images: [] });
    }
    pendingRef.current.clear();

    const waiters = readyWaitersRef.current;
    readyWaitersRef.current = [];
    for (const waiter of waiters) waiter.reject(new Error(reason));

    setBusy(false);
    setPhase("idle");
    setPhaseDetail("Ready");
  }, []);

  const ensureWorker = useCallback((): Promise<Worker> => {
    if (workerRef.current && status === "ready") {
      return Promise.resolve(workerRef.current);
    }

    // A boot is already in flight: join the queue rather than starting a
    // second worker or displacing the caller that started this one.
    if (workerRef.current) {
      return new Promise<Worker>((resolve, reject) => {
        readyWaitersRef.current.push({ resolve, reject });
      });
    }

    const worker = new Worker(PYODIDE_WORKER_URL, PYODIDE_WORKER_OPTIONS);
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
          const waiters = readyWaitersRef.current;
          readyWaitersRef.current = [];
          for (const waiter of waiters) waiter.resolve(worker);
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
        case "reset-done": {
          // Namespace cleared; nothing for the UI to do beyond staying ready.
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
      readyWaitersRef.current.push({ resolve, reject });
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

      // `stop()` may have terminated this worker while we awaited the boot and
      // the datasets above. Posting to a dead worker would register a pending
      // run that can never resolve, wedging `busy` true and disabling every
      // Run button on the page.
      if (workerRef.current !== worker) {
        return { repr: null, images: [], error: "Stopped." };
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
