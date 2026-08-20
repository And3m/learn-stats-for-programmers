import { describe, expect, it } from "vitest";

import { lessonComponents } from "@/content/lesson-components";
import {
  chapterMinutes,
  chapters,
  courseStats,
  getAllLessons,
  getChapter,
  getLesson,
  getLessonNeighbors,
  lessonKey,
} from "@/lib/content";

describe("course structure", () => {
  it("has fourteen chapters numbered consecutively from one", () => {
    expect(chapters).toHaveLength(14);
    expect(chapters.map((chapter) => chapter.number)).toEqual(
      Array.from({ length: 14 }, (_, index) => index + 1),
    );
  });

  it("uses unique chapter slugs", () => {
    const slugs = chapters.map((chapter) => chapter.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses unique lesson slugs within each chapter", () => {
    for (const chapter of chapters) {
      const slugs = chapter.lessons.map((lesson) => lesson.slug);
      expect(new Set(slugs).size, `duplicate lesson slug in ${chapter.slug}`).toBe(slugs.length);
    }
  });

  it("numbers lessons as chapter.position", () => {
    for (const chapter of chapters) {
      chapter.lessons.forEach((lesson, index) => {
        expect(lesson.number).toBe(`${chapter.number}.${index + 1}`);
      });
    }
  });

  it("gives every lesson a title, description and reading time", () => {
    for (const { chapter, lesson } of getAllLessons()) {
      const where = lessonKey(chapter.slug, lesson.slug);
      expect(lesson.title.length, where).toBeGreaterThan(0);
      expect(lesson.shortTitle.length, where).toBeGreaterThan(0);
      expect(lesson.description.length, where).toBeGreaterThan(20);
      expect(lesson.readingMinutes, where).toBeGreaterThan(0);
      expect(lesson.sourcePages, where).toMatch(/^\d+(-\d+)?$/);
    }
  });
});

describe("lesson sections", () => {
  it("gives every lesson at least three sections", () => {
    for (const { chapter, lesson } of getAllLessons()) {
      expect(lesson.sections.length, lessonKey(chapter.slug, lesson.slug)).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  it("uses unique, slug-shaped section ids within a lesson", () => {
    for (const { chapter, lesson } of getAllLessons()) {
      const ids = lesson.sections.map((section) => section.id);
      const where = lessonKey(chapter.slug, lesson.slug);
      expect(new Set(ids).size, `duplicate section id in ${where}`).toBe(ids.length);
      for (const id of ids) {
        expect(id, where).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    }
  });
});

describe("runtime declarations", () => {
  it("declares only packages that ship with the pinned Pyodide build", () => {
    const available = new Set([
      "numpy",
      "pandas",
      "scipy",
      "matplotlib",
      "scikit-learn",
      "statsmodels",
      "networkx",
      "sympy",
    ]);
    for (const { chapter, lesson } of getAllLessons()) {
      for (const pkg of lesson.runtime.packages) {
        expect(available.has(pkg), `${lessonKey(chapter.slug, lesson.slug)} -> ${pkg}`).toBe(true);
      }
    }
  });

  it("declares datasets as .csv filenames without a path", () => {
    for (const { chapter, lesson } of getAllLessons()) {
      for (const dataset of lesson.runtime.datasets) {
        expect(dataset, lessonKey(chapter.slug, lesson.slug)).toMatch(/^[a-z0-9-]+\.csv$/);
      }
    }
  });

  it("declares pandas whenever a dataset is used", () => {
    for (const { chapter, lesson } of getAllLessons()) {
      if (lesson.runtime.datasets.length === 0) continue;
      expect(
        lesson.runtime.packages.includes("pandas"),
        `${lessonKey(chapter.slug, lesson.slug)} reads a CSV but does not load pandas`,
      ).toBe(true);
    }
  });
});

describe("MDX component map", () => {
  it("has a component for every declared lesson", () => {
    for (const { chapter, lesson } of getAllLessons()) {
      const key = lessonKey(chapter.slug, lesson.slug);
      expect(lessonComponents[key], `no MDX for ${key}`).toBeDefined();
    }
  });

  it("has no component without a matching lesson", () => {
    const declared = new Set(
      getAllLessons().map(({ chapter, lesson }) => lessonKey(chapter.slug, lesson.slug)),
    );
    for (const key of Object.keys(lessonComponents)) {
      expect(declared.has(key), `orphaned MDX file: ${key}`).toBe(true);
    }
  });
});

describe("lookups", () => {
  it("finds chapters and lessons by slug", () => {
    expect(getChapter("probability")?.number).toBe(2);
    expect(getLesson("probability", "counting-rules")?.number).toBe("2.2");
    expect(getChapter("nope")).toBeUndefined();
    expect(getLesson("probability", "nope")).toBeUndefined();
  });

  it("links neighbours across chapter boundaries", () => {
    const first = getAllLessons()[0];
    const startNeighbors = getLessonNeighbors(first.chapter.slug, first.lesson.slug);
    expect(startNeighbors.previous).toBeUndefined();
    expect(startNeighbors.next).toBeDefined();

    const last = getAllLessons().at(-1)!;
    const endNeighbors = getLessonNeighbors(last.chapter.slug, last.lesson.slug);
    expect(endNeighbors.next).toBeUndefined();
    expect(endNeighbors.previous).toBeDefined();

    // The last lesson of chapter 2 should point at the first of chapter 3.
    const boundary = getLessonNeighbors("probability", "random-variables");
    expect(boundary.next?.chapter.slug).toBe("distributions");
    expect(boundary.next?.lesson.slug).toBe("normal-distribution");
  });

  it("forms a chain where each lesson's next points back to it", () => {
    const all = getAllLessons();
    for (let index = 0; index < all.length - 1; index += 1) {
      const { chapter, lesson } = all[index];
      const next = getLessonNeighbors(chapter.slug, lesson.slug).next!;
      const back = getLessonNeighbors(next.chapter.slug, next.lesson.slug).previous!;
      expect(lessonKey(back.chapter.slug, back.lesson.slug)).toBe(
        lessonKey(chapter.slug, lesson.slug),
      );
    }
  });
});

describe("aggregates", () => {
  it("sums chapter minutes from its lessons", () => {
    const chapter = chapters[1];
    const expected = chapter.lessons.reduce((total, lesson) => total + lesson.readingMinutes, 0);
    expect(chapterMinutes(chapter)).toBe(expected);
  });

  it("reports course totals consistent with the chapter list", () => {
    const stats = courseStats();
    expect(stats.chapters).toBe(chapters.length);
    expect(stats.lessons).toBe(getAllLessons().length);
    expect(stats.minutes).toBe(
      chapters.reduce((total, chapter) => total + chapterMinutes(chapter), 0),
    );
  });
});
