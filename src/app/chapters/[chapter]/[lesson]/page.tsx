import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleShell } from "@/components/article-shell";
import { lessonComponents } from "@/content/lesson-components";
import { getAllLessons, getChapter, getLesson, lessonKey } from "@/lib/content";

type Params = { chapter: string; lesson: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  // Only lessons whose MDX exists are prerendered, so the site stays buildable
  // while chapters are still being written. Anything missing 404s.
  return getAllLessons()
    .filter(({ chapter, lesson }) => lessonKey(chapter.slug, lesson.slug) in lessonComponents)
    .map(({ chapter, lesson }) => ({ chapter: chapter.slug, lesson: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;
  const chapter = getChapter(chapterSlug);
  const lesson = getLesson(chapterSlug, lessonSlug);
  if (!chapter || !lesson) return {};

  return {
    title: lesson.title,
    description: lesson.description,
    openGraph: {
      title: `${lesson.title} · ${chapter.title}`,
      description: lesson.description,
      type: "article",
    },
  };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;

  const chapter = getChapter(chapterSlug);
  const lesson = getLesson(chapterSlug, lessonSlug);
  const key = lessonKey(chapterSlug, lessonSlug);
  const Content = lessonComponents[key as keyof typeof lessonComponents];

  if (!chapter || !lesson || !Content) notFound();

  return (
    <ArticleShell chapter={chapter} lesson={lesson}>
      <Content />
    </ArticleShell>
  );
}
