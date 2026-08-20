import type { Metadata } from "next";
import Link from "next/link";

import { chapterHref, chapterMinutes, chapters, courseStats } from "@/lib/content";

export const metadata: Metadata = {
  title: "Chapters",
  description:
    "All fourteen chapters, from probability and counting through regression, time series, simulation and statistical quality control.",
};

export default function ChaptersPage() {
  const stats = courseStats();

  return (
    <div className="shell">
      <div className="chapter-hero">
        <p className="eyebrow">Contents</p>
        <h1>Fourteen chapters, {stats.lessons} lessons.</h1>
        <p className="chapter-hero__overview">
          The order is deliberate — probability underpins the distributions, the distributions
          underpin regression, and regression underpins everything that follows. You can jump
          straight to a topic, but chapters 2 and 3 repay reading first.
        </p>
        <div className="chapter-hero__meta">
          <span>{stats.chapters} chapters</span>
          <span>{stats.lessons} lessons</span>
          <span>{Math.round(stats.minutes / 60)} hours</span>
        </div>
      </div>

      <ol className="lesson-cards">
        {chapters.map((chapter) => (
          <li key={chapter.slug}>
            <Link className="lesson-card" href={chapterHref(chapter.slug)}>
              <span className="lesson-card__number">
                {String(chapter.number).padStart(2, "0")}
              </span>
              <span>
                <span className="lesson-card__title" style={{ display: "block" }}>
                  {chapter.title}
                </span>
                <p className="lesson-card__description">{chapter.overview}</p>
              </span>
              <span className="lesson-card__meta">
                {chapter.lessons.length} lessons
                <br />
                {chapterMinutes(chapter)} min
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
