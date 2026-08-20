/**
 * Node-side host for the same Python bootstrap the browser worker runs.
 *
 * `scripts/verify-python.mjs` uses this to execute every snippet in the course
 * headlessly, which is what stops a broken code cell from ever reaching a
 * reader. Because both sides load `public/pyodide-bootstrap.py`, a green run
 * here is meaningful evidence about the browser.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadPyodide } from "pyodide";

const here = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(here, "..");

const BOOTSTRAP_PATH = path.join(projectRoot, "public", "pyodide-bootstrap.py");
const DEFAULT_DATASET_DIRS = [path.join(projectRoot, "public", "datasets")];

async function readDataset(dirs, name) {
  for (const dir of dirs) {
    try {
      return await readFile(path.join(dir, name), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`Dataset "${name}" was not found in: ${dirs.join(", ")}`);
}

const LIGHT_PALETTE = {
  background: "#ffffff",
  foreground: "#0d1117",
  muted: "#5b6b7c",
  border: "#e3e8ee",
  series: ["#1a5fb4", "#c64600", "#2a7a4f", "#a0348a", "#8a6d00"],
};

export async function createHost({ onStdout, onStderr, datasetDirs = [] } = {}) {
  const searchDirs = [...datasetDirs, ...DEFAULT_DATASET_DIRS];
  const stdout = [];
  const stderr = [];

  const pyodide = await loadPyodide({
    stdout: (text) => {
      stdout.push(text);
      onStdout?.(text);
    },
    stderr: (text) => {
      stderr.push(text);
      onStderr?.(text);
    },
  });

  const bootstrap = await readFile(BOOTSTRAP_PATH, "utf8");
  await pyodide.runPythonAsync(bootstrap);

  const loaded = new Set();
  const mounted = new Set();

  async function applyTheme(palette = LIGHT_PALETTE) {
    const fn = pyodide.globals.get("_lsfp_theme");
    try {
      fn(JSON.stringify(palette));
    } finally {
      fn.destroy();
    }
  }

  await applyTheme();

  async function loadPackages(packages = []) {
    const pending = packages.filter((name) => !loaded.has(name));
    if (pending.length === 0) return;
    await pyodide.loadPackage(pending);
    for (const name of pending) loaded.add(name);
    // matplotlib may only just have arrived.
    await applyTheme();
  }

  async function mountDatasets(datasets = []) {
    for (const name of datasets) {
      if (mounted.has(name)) continue;
      const text = await readDataset(searchDirs, name);
      pyodide.FS.writeFile(name, text);
      mounted.add(name);
    }
  }

  async function run(code, { packages = [], datasets = [] } = {}) {
    await loadPackages(packages);
    await mountDatasets(datasets);

    stdout.length = 0;
    stderr.length = 0;

    const fn = pyodide.globals.get("_lsfp_run");
    let payload;
    try {
      payload = await fn(code);
    } finally {
      fn.destroy();
    }

    const parsed = JSON.parse(payload);
    return {
      ...parsed,
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n"),
    };
  }

  function resetNamespace() {
    const fn = pyodide.globals.get("_lsfp_reset");
    try {
      fn();
    } finally {
      fn.destroy();
    }
  }

  return { pyodide, run, loadPackages, mountDatasets, resetNamespace, applyTheme };
}
