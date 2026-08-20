"use client";

import Link from "next/link";

import { useProgress } from "@/components/progress/use-progress";
import { getAllLessons, lessonHref, lessonKey } from "@/lib/content";
import { percentComplete } from "@/lib/progress";

/** Shown on the home page once the reader has started. Renders nothing on the
 *  server and on a fresh browser, so first-time visitors see a clean page. */
export function ResumeCard() {
  const progress = useProgress();
  const all = getAllLessons();
  const keys = all.map(({ chapter, lesson }) => lessonKey(chapter.slug, lesson.slug));

  const completed = new Set(progress.completed);
  if (completed.size === 0 && !progress.lastVisited) return null;

  // Resume at the last lesson visited, or the first one not yet completed.
  const target =
    all.find(
      ({ chapter, lesson }) => lessonKey(chapter.slug, lesson.slug) === progress.lastVisited,
    ) ?? all.find(({ chapter, lesson }) => !completed.has(lessonKey(chapter.slug, lesson.slug)));

  if (!target) return null;

  const percent = percentComplete(progress, keys);

  return (
    <div className="resume-card">
      <div>
        <p className="eyebrow">Pick up where you left off</p>
        <p className="resume-card__title">{target.lesson.title}</p>
        <p className="resume-card__meta">
          {target.chapter.title} · {completed.size} of {keys.length} lessons complete
        </p>
        <div className="resume-card__meter">
          <div className="resume-card__fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <Link
        className="btn btn--primary"
        href={lessonHref(target.chapter.slug, target.lesson.slug)}
      >
        Continue
      </Link>
    </div>
  );
}
