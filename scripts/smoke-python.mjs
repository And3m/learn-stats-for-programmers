/**
 * Smoke test for the Python runtime: proves the bootstrap does what the lessons
 * rely on before any lesson is written against it.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { createHost } from "./python-host.mjs";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

const cases = [
  {
    name: "stdout streaming and last-expression repr",
    packages: [],
    code: `print("hello from CPython")\n1 + 1`,
    expect: (result) => {
      if (!result.stdout.includes("hello from CPython")) return "stdout not captured";
      if (result.repr !== "2") return `expected repr "2", got ${JSON.stringify(result.repr)}`;
      return null;
    },
  },
  {
    name: "namespace persists across cells",
    packages: [],
    code: `shared_value = 41`,
    expect: () => null,
  },
  {
    name: "second cell sees the first cell's variables",
    packages: [],
    code: `shared_value + 1`,
    expect: (result) => (result.repr === "42" ? null : `expected 42, got ${result.repr}`),
  },
  {
    name: "numpy and scipy",
    packages: ["numpy", "scipy"],
    code: `import numpy as np\nfrom scipy import stats\nround(float(stats.norm.cdf(1.96)), 6)`,
    expect: (result) =>
      result.repr === "0.975002" ? null : `expected 0.975002, got ${result.repr}`,
  },
  {
    name: "pandas reads a mounted dataset",
    packages: ["numpy", "pandas"],
    datasets: ["smoke.csv"],
    code: `import pandas as pd\ndf = pd.read_csv("smoke.csv")\nint(df["value"].sum())`,
    expect: (result) => (result.repr === "6" ? null : `expected 6, got ${result.repr}`),
  },
  {
    name: "matplotlib figure is captured without show()",
    packages: ["numpy", "matplotlib"],
    code: `import matplotlib.pyplot as plt\nimport numpy as np\nx = np.linspace(0, 6, 100)\nfig, ax = plt.subplots()\nax.plot(x, np.sin(x))\nax.set_title("sine")`,
    expect: (result) =>
      result.images.length === 1 ? null : `expected 1 figure, got ${result.images.length}`,
  },
  {
    name: "explicit show() also captures",
    packages: ["numpy", "matplotlib"],
    code: `import matplotlib.pyplot as plt\nplt.plot([1, 2, 3], [3, 1, 2])\nplt.show()`,
    expect: (result) =>
      result.images.length === 1 ? null : `expected 1 figure, got ${result.images.length}`,
  },
  {
    name: "the palette reaches matplotlib",
    packages: ["matplotlib"],
    code: `import matplotlib\nmatplotlib.rcParams["axes.prop_cycle"].by_key()["color"][0]`,
    expect: (result) =>
      result.repr === "'#1a5fb4'" ? null : `expected '#1a5fb4', got ${result.repr}`,
  },
  {
    name: "tracebacks are returned, not thrown, and omit the wrapper frame",
    packages: [],
    code: `def boom():\n    raise ValueError("nope")\n\nboom()`,
    expect: (result) => {
      if (!result.error) return "expected an error";
      if (!result.error.includes("ValueError: nope")) return "error text missing";
      if (result.error.includes("_lsfp_run")) return "wrapper frame leaked into the traceback";
      return null;
    },
  },
  {
    name: "top-level await works",
    packages: [],
    code: `import asyncio\nawait asyncio.sleep(0)\n"awaited"`,
    expect: (result) => (result.repr === "'awaited'" ? null : `got ${result.repr}`),
  },
  {
    name: "statsmodels and scikit-learn import",
    packages: ["numpy", "pandas", "statsmodels", "scikit-learn"],
    code: `import statsmodels.api as sm\nfrom sklearn.ensemble import RandomForestClassifier\n"ok"`,
    expect: (result) => (result.repr === "'ok'" ? null : `got ${result.repr}`),
  },
];

async function main() {
  console.log("Booting Pyodide in Node…");
  const host = await createHost({ datasetDirs: [fixtures] });
  console.log(`Python ${host.pyodide.version ?? ""} ready.\n`);

  let failures = 0;

  for (const testCase of cases) {
    const result = await host.run(testCase.code, {
      packages: testCase.packages,
      datasets: testCase.datasets,
    });

    let problem = null;
    if (result.error && !testCase.name.includes("traceback")) {
      problem = `unexpected traceback:\n${result.error}`;
    } else {
      problem = testCase.expect(result);
    }

    if (problem) {
      failures += 1;
      console.log(`FAIL  ${testCase.name}\n      ${problem.replace(/\n/g, "\n      ")}`);
    } else {
      console.log(`ok    ${testCase.name}`);
    }
  }

  console.log(`\n${cases.length - failures}/${cases.length} passed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
