"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { PyPackage } from "@/lib/content";

type LessonRuntime = { packages: PyPackage[]; datasets: string[] };

const EMPTY: LessonRuntime = { packages: [], datasets: [] };

const LessonRuntimeContext = createContext<LessonRuntime>(EMPTY);

/** Supplies the packages and datasets declared for the current lesson in
 *  `src/lib/content.ts`, so an MDX <PythonCell> never has to repeat them. */
export function LessonRuntimeProvider({
  packages,
  datasets,
  children,
}: LessonRuntime & { children: ReactNode }) {
  const value = useMemo(() => ({ packages, datasets }), [packages, datasets]);
  return <LessonRuntimeContext.Provider value={value}>{children}</LessonRuntimeContext.Provider>;
}

export function useLessonRuntime(): LessonRuntime {
  return useContext(LessonRuntimeContext);
}
