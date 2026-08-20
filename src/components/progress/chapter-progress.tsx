"use client";

import { useProgress } from "@/components/progress/use-progress";
import { countCompleted } from "@/lib/progress";

/** Real completion, as opposed to the sidebar's positional meter. */
export function ChapterProgress({ lessonKeys }: { lessonKeys: string[] }) {
  const progress = useProgress();
  const done = countCompleted(progress, lessonKeys);
  if (done === 0) return null;

  return (
    <span>
      {done} of {lessonKeys.length} complete
    </span>
  );
}
