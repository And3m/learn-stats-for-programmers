import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  PYODIDE_INDEX_URL,
  PYODIDE_VERSION,
  PYODIDE_WORKER_OPTIONS,
  PYODIDE_WORKER_URL,
  REQUEST_TYPES,
  RESPONSE_TYPES,
} from "@/lib/python-runtime";

/**
 * The worker is a static asset in `public/`, so nothing type-checks it against
 * the protocol declared here — the two can drift silently, and a drift only
 * shows up as a dead Run button in a reader's browser. Both files claim this
 * suite guards them; this is that guard.
 *
 * It reads the worker as text on purpose. Importing it is impossible (it is a
 * module worker that expects `self.onmessage`), and the contract worth pinning
 * is the source-level one.
 */
const workerSource = readFileSync(
  path.join(process.cwd(), "public", PYODIDE_WORKER_URL.replace(/^\//, "")),
  "utf8",
);

describe("worker protocol", () => {
  it.each(REQUEST_TYPES)("worker handles the %s request", (type) => {
    expect(workerSource).toContain(`case "${type}":`);
  });

  it.each(RESPONSE_TYPES)("worker can emit the %s response", (type) => {
    expect(workerSource).toContain(`type: "${type}"`);
  });

  it("handles every request type it declares and nothing more", () => {
    const cases = [...workerSource.matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]);
    expect(new Set(cases)).toEqual(new Set(REQUEST_TYPES));
  });
});

describe("worker module contract", () => {
  /**
   * Pyodide 314 throws "Classic web workers are not supported", and some
   * browsers block cross-origin `importScripts` outright even when a plain
   * `fetch` of the same URL succeeds. Both failures land as an unusable
   * runtime, so pin the module-worker decision in both halves.
   */
  it("is spawned as a module worker", () => {
    expect(PYODIDE_WORKER_OPTIONS.type).toBe("module");
  });

  it("loads the runtime with a dynamic import, never importScripts", () => {
    // A call, not the word — the file's own header explains why it stopped
    // using `importScripts`, and that prose must not fail the check.
    expect(workerSource).not.toMatch(/\bimportScripts\s*\(/);
    expect(workerSource).toContain("await import(");
  });

  it("imports the ESM build, which is the only one a module worker can load", () => {
    expect(workerSource).toContain("pyodide.mjs");
    expect(workerSource).not.toContain("pyodide.js`");
  });
});

describe("pinned runtime", () => {
  it("builds an index URL the worker can concatenate a filename onto", () => {
    expect(PYODIDE_INDEX_URL).toMatch(/^https:\/\//);
    expect(PYODIDE_INDEX_URL.endsWith("/")).toBe(true);
    expect(PYODIDE_INDEX_URL).toContain(PYODIDE_VERSION);
  });
});
