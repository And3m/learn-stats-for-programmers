import { describe, expect, it } from "vitest";

import { chapters, getAllLessons } from "@/lib/content";
import { glossary, glossaryHref } from "@/lib/glossary";
import { buildSearchIndex, KIND_LABEL } from "@/lib/search-index";

const index = buildSearchIndex();

describe("search index", () => {
  it("includes every chapter, lesson and section", () => {
    const sectionCount = getAllLessons().reduce(
      (total, { lesson }) => total + lesson.sections.length,
      0,
    );

    expect(index.filter((entry) => entry.kind === "chapter")).toHaveLength(chapters.length);
    expect(index.filter((entry) => entry.kind === "lesson")).toHaveLength(getAllLessons().length);
    expect(index.filter((entry) => entry.kind === "section")).toHaveLength(sectionCount);
    expect(index.filter((entry) => entry.kind === "term")).toHaveLength(glossary.length);
  });

  it("gives every entry a unique id", () => {
    const ids = index.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every entry a title, context and root-relative href", () => {
    for (const entry of index) {
      expect(entry.title.length, entry.id).toBeGreaterThan(0);
      expect(entry.context.length, entry.id).toBeGreaterThan(0);
      expect(entry.href, entry.id).toMatch(/^\//);
      expect(KIND_LABEL[entry.kind], entry.id).toBeDefined();
    }
  });

  it("points section entries at an anchor on their lesson", () => {
    const sections = index.filter((entry) => entry.kind === "section");
    for (const entry of sections) {
      expect(entry.href, entry.id).toMatch(/^\/chapters\/[a-z0-9-]+\/[a-z0-9-]+#[a-z0-9-]+$/);
    }
  });
});

describe("glossary", () => {
  it("has unique terms", () => {
    const terms = glossary.map((entry) => entry.term);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("gives every term a substantive definition", () => {
    for (const entry of glossary) {
      expect(entry.definition.length, entry.term).toBeGreaterThan(30);
    }
  });

  it("links only to lessons that exist", () => {
    const known = new Set(
      getAllLessons().map(({ chapter, lesson }) => `${chapter.slug}/${lesson.slug}`),
    );
    for (const entry of glossary) {
      if (!entry.chapter || !entry.lesson) continue;
      expect(known.has(`${entry.chapter}/${entry.lesson}`), entry.term).toBe(true);
    }
  });

  it("links only to sections that exist on the target lesson", () => {
    const sectionsByLesson = new Map(
      getAllLessons().map(({ chapter, lesson }) => [
        `${chapter.slug}/${lesson.slug}`,
        new Set(lesson.sections.map((section) => section.id)),
      ]),
    );

    for (const entry of glossary) {
      if (!entry.chapter || !entry.lesson || !entry.section) continue;
      const sections = sectionsByLesson.get(`${entry.chapter}/${entry.lesson}`);
      expect(sections?.has(entry.section), `${entry.term} -> #${entry.section}`).toBe(true);
    }
  });

  it("builds an href for every linked term", () => {
    for (const entry of glossary) {
      const href = glossaryHref(entry);
      if (entry.chapter && entry.lesson) {
        expect(href, entry.term).toMatch(/^\/chapters\//);
      } else {
        expect(href, entry.term).toBeNull();
      }
    }
  });

  it("covers every chapter", () => {
    const covered = new Set(glossary.map((entry) => entry.chapter).filter(Boolean));
    for (const chapter of chapters) {
      if (chapter.slug === "groundwork") continue; // introductory, few defined terms
      expect(covered.has(chapter.slug), `no glossary term for ${chapter.slug}`).toBe(true);
    }
  });
});
