"use client";

import { useState } from "react";

import { LessonRuntimeProvider } from "@/components/python/lesson-runtime-context";
import { PyodideProvider } from "@/components/python/pyodide-provider";
import { PythonCell } from "@/components/python/python-cell";
import { RuntimeStatus } from "@/components/python/runtime-status";
import type { PyPackage } from "@/lib/content";

const AVAILABLE: PyPackage[] = [
  "numpy",
  "pandas",
  "scipy",
  "matplotlib",
  "scikit-learn",
  "statsmodels",
  "networkx",
  "sympy",
];

const STARTER = `import numpy as np

rng = np.random.default_rng(7)
sample = rng.normal(loc=100, scale=15, size=2_000)

print(f"mean   {sample.mean():.2f}")
print(f"stdev  {sample.std(ddof=1):.2f}")
print(f"median {np.median(sample):.2f}")
`;

export function PlaygroundClient() {
  const [packages, setPackages] = useState<PyPackage[]>(["numpy"]);

  const toggle = (name: PyPackage) =>
    setPackages((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );

  return (
    <PyodideProvider>
      <LessonRuntimeProvider packages={packages} datasets={[]}>
        <fieldset className="package-picker">
          <legend className="eyebrow">Libraries to load</legend>
          {AVAILABLE.map((name) => (
            <label key={name} className="package-picker__item">
              <input
                type="checkbox"
                checked={packages.includes(name)}
                onChange={() => toggle(name)}
              />
              <code>{name}</code>
            </label>
          ))}
        </fieldset>

        <RuntimeStatus />
        <PythonCell label="Scratchpad" code={STARTER} />
      </LessonRuntimeProvider>
    </PyodideProvider>
  );
}
