import type { PyPackage } from "@/lib/content";

/**
 * Pinned Pyodide build. 314.x tracks CPython 3.14 and ships numpy, pandas,
 * scipy, matplotlib, scikit-learn, statsmodels, sympy and networkx — every
 * package this course needs.
 *
 * Bump deliberately: a new build changes the library versions learners see in
 * their own output, so re-run `npm run verify:python` after any change.
 */
export const PYODIDE_VERSION = "314.0.5";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Path to the static worker script. Served from `public/`, never bundled. */
export const PYODIDE_WORKER_URL = "/pyodide-worker.js";

/* ---------------------------------------------------------------------------
   Palette handed to matplotlib
   --------------------------------------------------------------------------- */

export type PythonPalette = {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  series: string[];
};

const FALLBACK_PALETTE: PythonPalette = {
  background: "#ffffff",
  foreground: "#0d1117",
  muted: "#5b6b7c",
  border: "#e3e8ee",
  series: ["#1a5fb4", "#c64600", "#2a7a4f", "#a0348a", "#8a6d00"],
};

/**
 * Read the live design tokens so Python-generated figures use exactly the
 * colours the surrounding page does — including after a theme switch.
 */
export function readPalette(): PythonPalette {
  if (typeof window === "undefined") return FALLBACK_PALETTE;

  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    background: token("--background", FALLBACK_PALETTE.background),
    foreground: token("--foreground", FALLBACK_PALETTE.foreground),
    muted: token("--muted", FALLBACK_PALETTE.muted),
    border: token("--border", FALLBACK_PALETTE.border),
    series: (["--s1", "--s2", "--s3", "--s4", "--s5"] as const).map((name, index) =>
      token(name, FALLBACK_PALETTE.series[index]),
    ),
  };
}

/* ---------------------------------------------------------------------------
   Message protocol — mirrored by public/pyodide-worker.js
   --------------------------------------------------------------------------- */

export type DatasetFile = { name: string; text: string };

export type WorkerRequest =
  | { type: "init"; indexURL: string; palette: PythonPalette }
  | {
      type: "run";
      id: string;
      code: string;
      packages: PyPackage[];
      datasets: DatasetFile[];
      palette: PythonPalette;
    }
  | { type: "theme"; palette: PythonPalette }
  | { type: "reset" };

export type RuntimePhase =
  | "idle"
  | "downloading"
  | "booting"
  | "loading-package"
  | "running";

export type WorkerResponse =
  | { type: "status"; phase: RuntimePhase; detail: string | null }
  | { type: "ready"; version?: string }
  | { type: "stream"; id: string | null; stream: "stdout" | "stderr"; text: string }
  | {
      type: "result";
      id: string;
      repr: string | null;
      error: string | null;
      images: string[];
    }
  | { type: "reset-done" }
  | { type: "fatal"; error: string };

/** Request `type` values the worker knows how to handle. */
export const REQUEST_TYPES = ["init", "run", "theme", "reset"] as const;

/** Response `type` values the provider knows how to handle. */
export const RESPONSE_TYPES = [
  "status",
  "ready",
  "stream",
  "result",
  "reset-done",
  "fatal",
] as const;

export function phaseLabel(phase: RuntimePhase, detail: string | null): string {
  switch (phase) {
    case "downloading":
      return "Downloading the Python runtime…";
    case "booting":
      return "Starting CPython…";
    case "loading-package":
      return `Loading ${detail ?? "packages"}…`;
    case "running":
      return "Running…";
    default:
      return "Ready";
  }
}
