"use client";

import { useSyncExternalStore } from "react";

import {
  getProgressSnapshot,
  getServerProgressSnapshot,
  subscribeToProgress,
  type ProgressState,
} from "@/lib/progress";

/** Subscribes to the localStorage-backed progress store. Returns the empty
 *  state during SSR and on the first client render, so markup matches. */
export function useProgress(): ProgressState {
  return useSyncExternalStore(
    subscribeToProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
}
