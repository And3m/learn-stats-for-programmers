import Link from "next/link";
import type { ReactNode } from "react";

import { LessonSidebar } from "@/components/lesson-sidebar";
import { LessonToc } from "@/components/lesson-toc";
import { CompleteButton } from "@/components/progress/complete-button";
import { LessonRuntimeProvider } from "@/components/python/lesson-runtime-context";
import { RuntimeStatus } from "@/components/python/runtime-status";
import { ReadingProgress } from "@/components/reading-progress";
import {
  chapterHref,
  getLessonNeighbors,
  lessonHref,
  lessonKey,
  type Chapter,
  type Lesson,
} from "@/lib/content";

export function ArticleShell({
  chapter,
  lesson,
  children,
}: {
  chapter: Chapter;
  lesson: Lesson;
  children: ReactNode;
}) {
  const { previous, next } = getLessonNeighbors(chapter.slug, lesson.slug);
  const key = lessonKey(chapter.slug, lesson.slug);

  return (
    <LessonRuntimeProvider packages={lesson.runtime.packages} datasets={lesson.runtime.datasets}>
      <ReadingProgress />
      <div className="shell">
        <div className="lesson-layout">
          <aside className="lesson-rail lesson-layout__sidebar">
            <LessonSidebar chapter={chapter} lesson={lesson} />
          </aside>

          <article>
            <nav className="article__breadcrumb" aria-label="Breadcrumb">
              <Link href="/chapters">Chapters</Link>
              <span aria-hidden>/</span>
              <Link href={chapterHref(chapter.slug)}>{chapter.shortTitle}</Link>
              <span aria-hidden>/</span>
              <span>{lesson.number}</span>
            </nav>

            <h1 className="article__title">{lesson.title}</h1>
            <p className="article__description">{lesson.description}</p>
            <div className="article__meta">
              <span>Lesson {lesson.number}</span>
              <span>{lesson.readingMinutes} min</span>
              {lesson.runtime.packages.length > 0 ? <span>Runnable Python</span> : null}
            </div>

            <RuntimeStatus />

            <div className="prose">{children}</div>

            <div className="lesson-footer">
              <CompleteButton lessonKey={key} />
              {next ? (
                <Link
                  className="btn btn--ghost"
                  href={lessonHref(next.chapter.slug, next.lesson.slug)}
                >
                  Next: {next.lesson.shortTitle} →
                </Link>
              ) : null}
            </div>

            <nav className="pager" aria-label="Lesson navigation">
              {previous ? (
                <Link
                  className="pager__item"
                  href={lessonHref(previous.chapter.slug, previous.lesson.slug)}
                >
                  <span className="pager__direction">Previous</span>
                  <span className="pager__title">{previous.lesson.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  className="pager__item pager__item--next"
                  href={lessonHref(next.chapter.slug, next.lesson.slug)}
                >
                  <span className="pager__direction">Next</span>
                  <span className="pager__title">{next.lesson.title}</span>
                </Link>
              ) : (
                <Link className="pager__item pager__item--next" href="/chapters">
                  <span className="pager__direction">Finished</span>
                  <span className="pager__title">Back to all chapters</span>
                </Link>
              )}
            </nav>
          </article>

          <aside className="lesson-rail lesson-layout__toc">
            <LessonToc lesson={lesson} />
          </aside>
        </div>
      </div>
    </LessonRuntimeProvider>
  );
}
