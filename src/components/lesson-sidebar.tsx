"use client";

import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";

import { useProgress } from "@/components/progress/use-progress";
import {
  chapterHref,
  chapters,
  lessonHref,
  lessonKey,
  type Chapter,
  type Lesson,
} from "@/lib/content";

export function LessonSidebar({ chapter, lesson }: { chapter: Chapter; lesson: Lesson }) {
  const progress = useProgress();
  const completed = new Set(progress.completed);

  const index = chapter.lessons.findIndex((item) => item.slug === lesson.slug);
  const position = ((index + 1) / chapter.lessons.length) * 100;

  return (
    <nav aria-label={`${chapter.title} lessons`}>
      <Link className="sidebar__back" href="/chapters">
        <ChevronLeft size={12} aria-hidden /> All chapters
      </Link>

      <p className="eyebrow">Chapter {chapter.number}</p>
      <h2 className="sidebar__chapter-title">
        <Link href={chapterHref(chapter.slug)}>{chapter.title}</Link>
      </h2>

      <div className="sidebar-meter">
        <div className="sidebar-meter__fill" style={{ width: `${position}%` }} />
      </div>
      <p className="sidebar__meter-label">
        {index + 1} of {chapter.lessons.length} lessons
      </p>

      <ol className="sidebar__list">
        {chapter.lessons.map((item) => {
          const key = lessonKey(chapter.slug, item.slug);
          const isCurrent = item.slug === lesson.slug;
          return (
            <li key={item.slug}>
              <Link
                className="sidebar__link"
                href={lessonHref(chapter.slug, item.slug)}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span className="sidebar__number">{item.number}</span>
                <span>{item.shortTitle}</span>
                <span className="sidebar__check">
                  {completed.has(key) ? <Check size={12} aria-label="Completed" /> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="sidebar__other">
        <p className="eyebrow">Other chapters</p>
        <ol>
          {chapters
            .filter((item) => item.slug !== chapter.slug)
            .map((item) => (
              <li key={item.slug}>
                <Link className="sidebar__other-link" href={chapterHref(item.slug)}>
                  <span className="sidebar__number">
                    {String(item.number).padStart(2, "0")}
                  </span>
                  <span>{item.shortTitle}</span>
                </Link>
              </li>
            ))}
        </ol>
      </div>
    </nav>
  );
}
