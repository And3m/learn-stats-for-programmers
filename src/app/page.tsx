import Link from "next/link";

import { chapterHref, chapterMinutes, chapters, courseStats } from "@/lib/content";

export default function HomePage() {
  const stats = courseStats();

  return (
    <div className="shell">
      <div className="home">
        <aside className="home__aside">
          <div className="book-cover">
            <div>
              <p className="book-cover__eyebrow">Interactive course</p>
              <div className="book-cover__rule" />
              <h2 className="book-cover__title">
                Statistics
                <br />
                for
                <br />
                Programmers
              </h2>
            </div>
            <p className="book-cover__meta">
              {stats.chapters} chapters
              <br />
              {stats.lessons} lessons
              <br />
              Python in the browser
            </p>
          </div>
        </aside>

        <div className="home__intro">
          <p className="eyebrow">A self-paced course</p>
          <h1>The statistics programmers actually use.</h1>
          <p className="home__lede">
            Most of us can compute a mean and plot a histogram. Far fewer can say what a p-value
            licenses us to claim, when a Poisson model is the wrong one, or why a 99%-accurate
            classifier can be worthless. This course closes that gap — one concept at a time, with
            real Python running in the page rather than screenshots of someone else&rsquo;s output.
          </p>
          <p className="home__lede">
            Fourteen chapters take you from coin flips to control charts: probability and counting,
            the four distributions that cover most practical work, regression you can defend, trees
            and forests, time series, optimisation, simulation, Markov chains, Benford&rsquo;s law,
            project scheduling, and statistical quality control.
          </p>

          <div className="home__cta">
            <Link className="btn btn--primary" href="/chapters/groundwork/why-quantitative-thinking">
              Start with chapter 1
            </Link>
            <Link className="btn" href="/chapters">
              Browse all chapters
            </Link>
          </div>

          <div className="stat-row">
            <div className="stat">
              <div className="stat__value">{stats.chapters}</div>
              <div className="stat__label">Chapters</div>
            </div>
            <div className="stat">
              <div className="stat__value">{stats.lessons}</div>
              <div className="stat__label">Lessons</div>
            </div>
            <div className="stat">
              <div className="stat__value">{Math.round(stats.minutes / 60)}h</div>
              <div className="stat__label">Reading time</div>
            </div>
          </div>

          <div className="section-heading">
            <h2>Contents</h2>
            <span className="eyebrow">{stats.chapters} chapters</span>
          </div>

          <ol className="chapter-list">
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link className="chapter-card" href={chapterHref(chapter.slug)}>
                  <span className="chapter-card__number">
                    {String(chapter.number).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="chapter-card__title">{chapter.title}</span>
                    <p className="chapter-card__description">{chapter.overview}</p>
                  </span>
                  <span className="chapter-card__meta">
                    {chapter.lessons.length} lessons
                    <br />
                    {chapterMinutes(chapter)} min
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
