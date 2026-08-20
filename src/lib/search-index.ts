/**
 * The search index, derived entirely from `content.ts` and `glossary.ts`.
 *
 * No separate data file and no build step: because all course structure is
 * already TypeScript, the index is just a projection of it, and it can never
 * drift out of date with the content it describes.
 */

import { chapterHref, chapters, lessonHref } from "@/lib/content";
import { glossary, glossaryHref } from "@/lib/glossary";

export type SearchEntry = {
  id: string;
  kind: "chapter" | "lesson" | "section" | "term" | "page";
  title: string;
  /** Where this sits — a chapter name, a lesson name, or a page group. */
  context: string;
  body: string;
  href: string;
};

const staticPages: SearchEntry[] = [
  {
    id: "page:playground",
    kind: "page",
    title: "Python playground",
    context: "Pages",
    body: "free-form scratchpad numpy pandas scipy matplotlib scikit-learn statsmodels run python browser",
    href: "/playground",
  },
  {
    id: "page:formulas",
    kind: "page",
    title: "Formula reference",
    context: "Pages",
    body: "cheat sheet formulas equations reference probability regression control charts",
    href: "/formulas",
  },
  {
    id: "page:glossary",
    kind: "page",
    title: "Glossary",
    context: "Pages",
    body: "definitions terms vocabulary index",
    href: "/glossary",
  },
  {
    id: "page:reading",
    kind: "page",
    title: "Further reading",
    context: "Pages",
    body: "books references sources bibliography manning gary sutton",
    href: "/reading",
  },
];

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const chapter of chapters) {
    entries.push({
      id: `chapter:${chapter.slug}`,
      kind: "chapter",
      title: chapter.title,
      context: `Chapter ${chapter.number}`,
      body: chapter.overview,
      href: chapterHref(chapter.slug),
    });

    for (const lesson of chapter.lessons) {
      const href = lessonHref(chapter.slug, lesson.slug);

      entries.push({
        id: `lesson:${chapter.slug}/${lesson.slug}`,
        kind: "lesson",
        title: lesson.title,
        context: chapter.title,
        body: `${lesson.description} ${lesson.sections.map((s) => s.label).join(" ")}`,
        href,
      });

      for (const section of lesson.sections) {
        entries.push({
          id: `section:${chapter.slug}/${lesson.slug}#${section.id}`,
          kind: "section",
          title: section.label,
          context: lesson.title,
          body: `${lesson.title} ${chapter.title}`,
          href: `${href}#${section.id}`,
        });
      }
    }
  }

  for (const entry of glossary) {
    const href = glossaryHref(entry) ?? "/glossary";
    entries.push({
      id: `term:${entry.term}`,
      kind: "term",
      title: entry.term,
      context: "Glossary",
      body: entry.definition,
      href,
    });
  }

  return [...entries, ...staticPages];
}

export const KIND_LABEL: Record<SearchEntry["kind"], string> = {
  chapter: "Chapter",
  lesson: "Lesson",
  section: "Section",
  term: "Term",
  page: "Page",
};
