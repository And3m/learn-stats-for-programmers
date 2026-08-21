/**
 * The main correctness gate for course content.
 *
 * Walks every lesson declared in `src/lib/content.ts`, extracts every
 * `<PythonCell>` from its MDX, and executes them in order against the same
 * bootstrap the browser worker uses — with that lesson's declared packages and
 * datasets. Any traceback fails the run, so no lesson can ship a code cell that
 * errors in a reader's browser.
 *
 * It also checks the structural contract MDX cannot enforce on its own: every
 * section id declared in `content.ts` must exist as a heading anchor in the MDX,
 * or the right-hand table of contents would link into nothing.
 *
 *   node scripts/verify-python.mjs                  # everything
 *   node scripts/verify-python.mjs probability      # one chapter
 *   node scripts/verify-python.mjs probability/odds # one lesson
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chapters } from "../src/lib/content.ts";
import { createHost, projectRoot } from "./python-host.mjs";

const CONTENT_DIR = path.join(projectRoot, "src", "content", "chapters");

const filter = process.argv[2] ?? null;

/* ---------------------------------------------------------------------------
   MDX extraction
   --------------------------------------------------------------------------- */

/** Cook a JavaScript template literal body the way the bundler would. */
function cookTemplate(raw) {
  return raw.replace(/\\([\s\S])/g, (_, ch) => {
    switch (ch) {
      case "n":
        return "\n";
      case "t":
        return "\t";
      case "r":
        return "\r";
      case "`":
        return "`";
      case "$":
        return "$";
      case "\\":
        return "\\";
      default:
        return ch;
    }
  });
}

/** Pull every `<PythonCell …>{`…`}</PythonCell>` body out of an MDX source. */
export function extractPythonCells(source) {
  const cells = [];
  const openTag = /<PythonCell\b/g;

  let match;
  while ((match = openTag.exec(source)) !== null) {
    const close = source.indexOf("</PythonCell>", match.index);
    if (close === -1) continue;

    const region = source.slice(match.index, close);
    const start = region.indexOf("{`");
    if (start === -1) continue;

    const end = region.lastIndexOf("`}");
    if (end <= start) continue;

    const labelMatch = /label="([^"]*)"/.exec(region.slice(0, region.indexOf(">")));

    cells.push({
      label: labelMatch ? labelMatch[1] : "unlabelled cell",
      code: cookTemplate(region.slice(start + 2, end)),
    });
  }

  return cells;
}

/**
 * Top-level modules a snippet imports.
 *
 * This matters because the verifier shares one interpreter across lessons, so a
 * package loaded by an earlier lesson stays importable — which would let a
 * lesson that forgot to declare a package pass here and then fail in a reader's
 * browser, where only its own declarations are loaded.
 */
export function extractImports(code) {
  const modules = new Set();
  const patterns = [/^\s*import\s+([A-Za-z_][\w.]*)/gm, /^\s*from\s+([A-Za-z_][\w.]*)\s+import/gm];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      modules.add(match[1].split(".")[0]);
    }
  }

  return modules;
}

/** Dataset filenames a snippet opens, so declarations can be checked too. */
export function extractDatasets(code) {
  const files = new Set();
  const pattern = /["']([A-Za-z0-9_-]+\.csv)["']/g;
  let match;
  while ((match = pattern.exec(code)) !== null) files.add(match[1]);
  return files;
}

/** Import name -> the Pyodide package that provides it. */
const MODULE_TO_PACKAGE = {
  numpy: "numpy",
  pandas: "pandas",
  scipy: "scipy",
  matplotlib: "matplotlib",
  mpl_toolkits: "matplotlib",
  cycler: "matplotlib",
  sklearn: "scikit-learn",
  statsmodels: "statsmodels",
  patsy: "statsmodels",
  networkx: "networkx",
  sympy: "sympy",
};

/** Heading anchors present in the MDX, from raw `<h2 id="…">` tags. */
export function extractAnchors(source) {
  const anchors = new Set();
  const pattern = /<h[23]\s+id="([^"]+)"/g;
  let match;
  while ((match = pattern.exec(source)) !== null) anchors.add(match[1]);
  return anchors;
}

/* ---------------------------------------------------------------------------
   Runner
   --------------------------------------------------------------------------- */

function matchesFilter(chapterSlug, lessonSlug) {
  if (!filter) return true;
  if (filter === chapterSlug) return true;
  return filter === `${chapterSlug}/${lessonSlug}`;
}

async function main() {
  const targets = [];

  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      if (!matchesFilter(chapter.slug, lesson.slug)) continue;
      targets.push({ chapter, lesson });
    }
  }

  if (targets.length === 0) {
    console.error(`No lessons matched "${filter}".`);
    process.exit(1);
  }

  console.log("Booting Pyodide…");
  const host = await createHost();
  console.log(`Python ${host.pyodide.version} ready.\n`);

  const problems = [];
  const warnings = [];
  let missing = 0;
  let cellsRun = 0;

  for (const { chapter, lesson } of targets) {
    const file = path.join(CONTENT_DIR, chapter.slug, `${lesson.slug}.mdx`);
    const key = `${chapter.slug}/${lesson.slug}`;

    let source;
    try {
      source = await readFile(file, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      missing += 1;
      console.log(`  --  ${key} (not written yet)`);
      continue;
    }

    // Structural check: declared sections must exist as anchors.
    const anchors = extractAnchors(source);
    for (const section of lesson.sections) {
      if (!anchors.has(section.id)) {
        problems.push({
          key,
          label: `section anchor "${section.id}"`,
          detail: `declared in content.ts but no <h2 id="${section.id}"> in the MDX`,
        });
      }
    }

    const cells = extractPythonCells(source);

    // Declared packages must match what the lesson actually imports.
    const declared = new Set(lesson.runtime.packages);
    const required = new Set();
    for (const cell of cells) {
      for (const imported of extractImports(cell.code)) {
        const pkg = MODULE_TO_PACKAGE[imported];
        if (pkg) required.add(pkg);
      }
    }

    for (const pkg of required) {
      if (!declared.has(pkg)) {
        problems.push({
          key,
          label: `undeclared package "${pkg}"`,
          detail:
            `imported by a code cell but missing from runtime.packages in content.ts — ` +
            `this would raise ImportError in the browser`,
        });
      }
    }

    const unused = [...declared].filter((pkg) => !required.has(pkg));
    if (unused.length > 0) {
      warnings.push(`${key} declares ${unused.join(", ")} but never imports it`);
    }

    // Same check for datasets: a CSV opened but not declared is never mounted.
    const declaredData = new Set(lesson.runtime.datasets);
    const usedData = new Set();
    for (const cell of cells) {
      for (const name of extractDatasets(cell.code)) usedData.add(name);
    }

    for (const name of usedData) {
      if (!declaredData.has(name)) {
        problems.push({
          key,
          label: `undeclared dataset "${name}"`,
          detail:
            `opened by a code cell but missing from runtime.datasets in content.ts — ` +
            `the file would not be mounted, raising FileNotFoundError`,
        });
      }
    }

    const unusedData = [...declaredData].filter((name) => !usedData.has(name));
    if (unusedData.length > 0) {
      warnings.push(`${key} declares dataset ${unusedData.join(", ")} but never reads it`);
    }

    // Each lesson gets a clean namespace, matching a fresh page load; cells
    // within a lesson share one, matching the page.
    host.resetNamespace();

    let failures = 0;
    for (const cell of cells) {
      const result = await host.run(cell.code, {
        packages: lesson.runtime.packages,
        datasets: lesson.runtime.datasets,
      });
      cellsRun += 1;

      if (result.error) {
        failures += 1;
        problems.push({ key, label: cell.label, detail: result.error.trimEnd() });
      }
    }

    const status = failures === 0 ? "ok" : "FAIL";
    console.log(
      `  ${status.padEnd(4)}${key}  (${cells.length} cell${cells.length === 1 ? "" : "s"}${
        lesson.runtime.packages.length ? `, ${lesson.runtime.packages.join(" ")}` : ""
      })`,
    );
  }

  console.log(
    `\n${cellsRun} cell${cellsRun === 1 ? "" : "s"} executed across ${
      targets.length - missing
    } lesson${targets.length - missing === 1 ? "" : "s"}.` +
      (missing ? ` ${missing} lesson${missing === 1 ? "" : "s"} not written yet.` : ""),
  );

  if (warnings.length > 0) {
    console.log(`
${warnings.length} warning${warnings.length === 1 ? "" : "s"}:`);
    for (const warning of warnings) console.log(`  ${warning}`);
  }

  if (problems.length > 0) {
    console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`);
    for (const problem of problems) {
      console.log(`${problem.key} — ${problem.label}`);
      console.log(
        problem.detail
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n"),
      );
      console.log();
    }
    process.exit(1);
  }

  console.log("All good.");
}

// Only run as a script. The extractors above are importable helpers, and
// importing them should not boot Pyodide and execute every cell in the course.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
