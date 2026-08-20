"use client";

import { Check, Circle } from "lucide-react";
import { useEffect } from "react";

import { useProgress } from "@/components/progress/use-progress";
import { markVisited, setLessonComplete } from "@/lib/progress";

export function CompleteButton({ lessonKey }: { lessonKey: string }) {
  const progress = useProgress();
  const complete = progress.completed.includes(lessonKey);

  useEffect(() => {
    markVisited(lessonKey);
  }, [lessonKey]);

  return (
    <button
      type="button"
      className={`btn${complete ? "" : " btn--primary"}`}
      aria-pressed={complete}
      onClick={() => setLessonComplete(lessonKey, !complete)}
    >
      {complete ? <Check size={15} aria-hidden /> : <Circle size={15} aria-hidden />}
      {complete ? "Completed" : "Mark complete"}
    </button>
  );
}
