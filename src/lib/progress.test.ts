import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearProgress,
  countCompleted,
  EMPTY_PROGRESS,
  getProgressSnapshot,
  markVisited,
  parseProgress,
  percentComplete,
  PROGRESS_KEY,
  setLessonComplete,
  subscribeToProgress,
} from "@/lib/progress";

describe("parseProgress", () => {
  it("returns the empty state for null, junk and wrong shapes", () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress("not json")).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('{"completed": "nope"}')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('{"completed": [1, 2]}')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress("[]")).toEqual(EMPTY_PROGRESS);
  });

  it("round-trips a valid state and de-duplicates keys", () => {
    const raw = JSON.stringify({
      completed: ["a/b", "a/b", "c/d"],
      lastVisited: "c/d",
      updatedAt: 42,
    });
    expect(parseProgress(raw)).toEqual({
      completed: ["a/b", "c/d"],
      lastVisited: "c/d",
      updatedAt: 42,
    });
  });

  it("tolerates a missing updatedAt", () => {
    expect(parseProgress('{"completed": [], "lastVisited": null}').updatedAt).toBe(0);
  });
});

describe("the store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // subscribe() performs the initial hydration from localStorage.
    subscribeToProgress(() => undefined);
    clearProgress();
  });

  it("marks a lesson complete and persists it", () => {
    setLessonComplete("probability/counting-rules", true);

    expect(getProgressSnapshot().completed).toContain("probability/counting-rules");
    const stored = parseProgress(window.localStorage.getItem(PROGRESS_KEY));
    expect(stored.completed).toContain("probability/counting-rules");
  });

  it("un-marks a lesson", () => {
    setLessonComplete("a/b", true);
    setLessonComplete("a/b", false);
    expect(getProgressSnapshot().completed).not.toContain("a/b");
  });

  it("does not duplicate a lesson marked complete twice", () => {
    setLessonComplete("a/b", true);
    setLessonComplete("a/b", true);
    expect(getProgressSnapshot().completed.filter((key) => key === "a/b")).toHaveLength(1);
  });

  it("records the last visited lesson", () => {
    markVisited("markov/equilibrium");
    expect(getProgressSnapshot().lastVisited).toBe("markov/equilibrium");
  });

  it("notifies subscribers on change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToProgress(listener);

    setLessonComplete("a/b", true);
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    setLessonComplete("c/d", true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("returns a referentially stable snapshot between writes", () => {
    const first = getProgressSnapshot();
    expect(getProgressSnapshot()).toBe(first);

    setLessonComplete("a/b", true);
    expect(getProgressSnapshot()).not.toBe(first);
  });

  it("clears everything", () => {
    setLessonComplete("a/b", true);
    markVisited("a/b");
    clearProgress();

    expect(getProgressSnapshot().completed).toEqual([]);
    expect(getProgressSnapshot().lastVisited).toBeNull();
  });
});

describe("derivations", () => {
  const state = { completed: ["a/b", "c/d"], lastVisited: null, updatedAt: 0 };

  it("counts completed keys from a list", () => {
    expect(countCompleted(state, ["a/b", "c/d", "e/f"])).toBe(2);
    expect(countCompleted(state, ["e/f"])).toBe(0);
    expect(countCompleted(state, [])).toBe(0);
  });

  it("computes a rounded percentage", () => {
    expect(percentComplete(state, ["a/b", "c/d", "e/f", "g/h"])).toBe(50);
    expect(percentComplete(state, ["a/b", "c/d"])).toBe(100);
    expect(percentComplete(state, ["a/b", "c/d", "e/f"])).toBe(67);
  });

  it("returns zero rather than dividing by zero", () => {
    expect(percentComplete(state, [])).toBe(0);
  });
});
