/* eslint-disable */
/**
 * Pyodide host worker.
 *
 * Deliberately a plain classic worker served as a static asset: `importScripts`
 * against the CDN keeps every bundler out of the way, in dev and in production
 * alike, and keeps the ~12 MB runtime out of the app's JavaScript payload.
 *
 * The message protocol mirrors `src/lib/python-runtime.ts` — keep the two in
 * step. `src/lib/python-runtime.test.ts` asserts they have not drifted.
 */

let pyodide = null;
let currentRunId = null;
const loadedPackages = new Set();

function post(message) {
  self.postMessage(message);
}

function status(phase, detail) {
  post({ type: "status", phase, detail });
}

/* ---------------------------------------------------------------------------
   Python-side bootstrap
   --------------------------------------------------------------------------- */

let BOOTSTRAP = null;

async function loadBootstrap() {
  if (BOOTSTRAP === null) {
    const response = await fetch("/pyodide-bootstrap.py");
    if (!response.ok) throw new Error("Could not load the Python bootstrap.");
    BOOTSTRAP = await response.text();
  }
  return BOOTSTRAP;
}

/* ---------------------------------------------------------------------------
   Handlers
   --------------------------------------------------------------------------- */

async function init(message) {
  if (pyodide) {
    post({ type: "ready" });
    return;
  }

  status("downloading", "Downloading the Python runtime");
  self.importScripts(`${message.indexURL}pyodide.js`);

  status("booting", "Starting CPython");
  pyodide = await self.loadPyodide({
    indexURL: message.indexURL,
    stdout: (text) => post({ type: "stream", id: currentRunId, stream: "stdout", text }),
    stderr: (text) => post({ type: "stream", id: currentRunId, stream: "stderr", text }),
  });

  await pyodide.runPythonAsync(await loadBootstrap());
  await applyTheme(message.palette);

  post({ type: "ready", version: pyodide.version });
}

async function applyTheme(palette) {
  if (!pyodide || !palette) return;
  const fn = pyodide.globals.get("_lsfp_theme");
  try {
    fn(JSON.stringify(palette));
  } finally {
    fn.destroy();
  }
}

async function loadPackages(packages, palette) {
  const pending = (packages || []).filter((name) => !loadedPackages.has(name));
  if (pending.length === 0) return;

  for (const name of pending) {
    status("loading-package", name);
    await pyodide.loadPackage(name);
    loadedPackages.add(name);
  }

  // matplotlib may have only just arrived; (re)apply the palette.
  await applyTheme(palette);
}

function mountDatasets(files) {
  for (const file of files || []) {
    pyodide.FS.writeFile(file.name, file.text);
  }
}

async function run(message) {
  currentRunId = message.id;

  try {
    await loadPackages(message.packages, message.palette);
    mountDatasets(message.datasets);

    status("running", null);
    const fn = pyodide.globals.get("_lsfp_run");
    let payload;
    try {
      payload = await fn(message.code);
    } finally {
      fn.destroy();
    }

    const parsed = JSON.parse(payload);
    post({
      type: "result",
      id: message.id,
      repr: parsed.repr,
      error: parsed.error,
      images: parsed.images,
    });
  } catch (error) {
    post({
      type: "result",
      id: message.id,
      repr: null,
      images: [],
      error: error && error.message ? error.message : String(error),
    });
  } finally {
    currentRunId = null;
    status("idle", null);
  }
}

function resetNamespace() {
  if (!pyodide) return;
  const fn = pyodide.globals.get("_lsfp_reset");
  try {
    fn();
  } finally {
    fn.destroy();
  }
}

self.onmessage = async (event) => {
  const message = event.data;

  try {
    switch (message.type) {
      case "init":
        await init(message);
        break;
      case "run":
        await run(message);
        break;
      case "theme":
        await applyTheme(message.palette);
        break;
      case "reset":
        resetNamespace();
        post({ type: "reset-done" });
        break;
      default:
        break;
    }
  } catch (error) {
    post({
      type: "fatal",
      error: error && error.message ? error.message : String(error),
    });
  }
};
