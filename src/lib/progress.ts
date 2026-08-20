/**
 * Completion tracking, kept entirely in localStorage.
 *
 * There is no account and no backend: progress belongs to the browser it was
 * made in. The store is exposed through `useSyncExternalStore`, which gives a
 * stable server snapshot and so avoids the hydration mismatch a naive
 * `useEffect` + `useState` pair would produce.
 */

export const PROGRESS_KEY = "lsfp:progress:v1";

export type ProgressState = {
  /** `chapterSlug/lessonSlug` keys, as produced by `lessonKey()`. */
  completed: string[];
  lastVisited: string | null;
  updatedAt: number;
};

export const EMPTY_PROGRESS: ProgressState = {
  completed: [],
  lastVisited: null,
  updatedAt: 0,
};

function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ProgressState>;
  return (
    Array.isArray(candidate.completed) &&
    candidate.completed.every((item) => typeof item === "string") &&
    (candidate.lastVisited === null || typeof candidate.lastVisited === "string")
  );
}

export function parseProgress(raw: string | null): ProgressState {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isProgressState(parsed)) return EMPTY_PROGRESS;
    return {
      completed: [...new Set(parsed.completed)],
      lastVisited: parsed.lastVisited ?? null,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

/* ---------------------------------------------------------------------------
   Store
   --------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

/** Cached so `getSnapshot` returns a referentially stable value between
 *  writes — required by useSyncExternalStore. */
let snapshot: ProgressState = EMPTY_PROGRESS;
let hydrated = false;

function read(): ProgressState {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  return parseProgress(window.localStorage.getItem(PROGRESS_KEY));
}

function write(next: ProgressState) {
  snapshot = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // Private browsing, quota, or a blocked origin — progress just will not
      // persist. Nothing else in the app depends on the write succeeding.
    }
  }
  for (const listener of listeners) listener();
}

export function subscribeToProgress(listener: () => void): () => void {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    snapshot = read();
  }

  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== PROGRESS_KEY) return;
    snapshot = parseProgress(event.newValue);
    for (const item of listeners) item();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getProgressSnapshot(): ProgressState {
  return snapshot;
}

export function getServerProgressSnapshot(): ProgressState {
  return EMPTY_PROGRESS;
}

/* ---------------------------------------------------------------------------
   Actions
   --------------------------------------------------------------------------- */

export function setLessonComplete(key: string, complete: boolean) {
  const current = snapshot;
  const completed = new Set(current.completed);
  if (complete) completed.add(key);
  else completed.delete(key);

  write({ ...current, completed: [...completed], updatedAt: Date.now() });
}

export function markVisited(key: string) {
  if (snapshot.lastVisited === key) return;
  write({ ...snapshot, lastVisited: key, updatedAt: Date.now() });
}

export function clearProgress() {
  write({ ...EMPTY_PROGRESS, updatedAt: Date.now() });
}

/* ---------------------------------------------------------------------------
   Derivations
   --------------------------------------------------------------------------- */

export function countCompleted(state: ProgressState, keys: string[]): number {
  const completed = new Set(state.completed);
  return keys.reduce((total, key) => total + (completed.has(key) ? 1 : 0), 0);
}

export function percentComplete(state: ProgressState, keys: string[]): number {
  if (keys.length === 0) return 0;
  return Math.round((countCompleted(state, keys) / keys.length) * 100);
}
