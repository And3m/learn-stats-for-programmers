import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChapterProgress } from "@/components/progress/chapter-progress";
import {
  chapterMinutes,
  chapters,
  getChapter,
  lessonHref,
  lessonKey,
} from "@/lib/content";

type Params = { chapter: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return chapters.map((chapter) => ({ chapter: chapter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { chapter: slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) return {};

  return {
    title: chapter.title,
    description: chapter.overview,
    openGraph: { title: chapter.title, description: chapter.overview, type: "article" },
  };
}

export default async function ChapterPage({ params }: { params: Promise<Params> }) {
  const { chapter: slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const keys = chapter.lessons.map((lesson) => lessonKey(chapter.slug, lesson.slug));

  return (
    <div className="shell">
      <div className="chapter-hero">
        <p className="eyebrow">Chapter {String(chapter.number).padStart(2, "0")}</p>
        <h1>{chapter.title}</h1>
        <p className="chapter-hero__overview">{chapter.overview}</p>
        <div className="chapter-hero__meta">
          <span>{chapter.lessons.length} lessons</span>
          <span>{chapterMinutes(chapter)} min</span>
          <span>Further reading: pp. {chapter.sourcePages}</span>
          <ChapterProgress lessonKeys={keys} />
        </div>
      </div>

      <ol className="lesson-cards">
        {chapter.lessons.map((lesson) => (
          <li key={lesson.slug}>
            <Link className="lesson-card" href={lessonHref(chapter.slug, lesson.slug)}>
              <span className="lesson-card__number">{lesson.number}</span>
              <span>
                <span className="lesson-card__title" style={{ display: "block" }}>
                  {lesson.title}
                </span>
                <p className="lesson-card__description">{lesson.description}</p>
              </span>
              <span className="lesson-card__meta">
                {lesson.readingMinutes} min
                {lesson.runtime.packages.length > 0 ? (
                  <>
                    <br />
                    Python
                  </>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
