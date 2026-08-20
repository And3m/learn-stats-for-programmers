import type { Metadata } from "next";

import { sourceBook } from "@/lib/content";

export const metadata: Metadata = {
  title: "Further reading",
  description:
    "The book this course takes its syllabus from, plus the standard references for each area it covers.",
};

export default function ReadingPage() {
  return (
    <div className="shell" style={{ maxWidth: "52rem", paddingBottom: "3rem" }}>
      <div className="chapter-hero">
        <p className="eyebrow">Reference</p>
        <h1>Further reading.</h1>
        <p className="chapter-hero__overview">
          This course is deliberately compact. Every chapter here has whole books written about it,
          and these are the ones worth reaching for next.
        </p>
      </div>

      <div className="page-prose">
        <h2>The book behind the syllabus</h2>
        <p>
          <a href={sourceBook.url} rel="noreferrer noopener" target="_blank">
            <strong>
              <em>{sourceBook.title}</em>
            </strong>
          </a>{" "}
          by {sourceBook.author} ({sourceBook.publisher}, {sourceBook.year}, ISBN {sourceBook.isbn}
          ).
        </p>
        <p>
          The chapter and topic structure of this course follows the book&rsquo;s, and each lesson
          cites the corresponding pages so you can read a fuller treatment of anything covered here.
          The course text, code and datasets are original — no text, figures, code listings or data
          from the book are reproduced. If this material is useful to you, the book is the natural
          next step and covers several topics in considerably more depth.
        </p>

        <h2>By area</h2>

        <h3>Probability and statistical foundations</h3>
        <ul>
          <li>
            <em>Statistics</em> — Freedman, Pisani and Purves. Unusually careful about what a
            statistic does and does not license you to claim.
          </li>
          <li>
            <em>Introduction to Probability</em> — Blitzstein and Hwang. Free online, with a
            companion lecture series.
          </li>
        </ul>

        <h3>Regression and modelling</h3>
        <ul>
          <li>
            <em>An Introduction to Statistical Learning</em> — James, Witten, Hastie and Tibshirani.
            Free PDF; the standard modern reference, with both R and Python editions.
          </li>
          <li>
            <em>Regression and Other Stories</em> — Gelman, Hill and Vehtari. Especially good on
            what regression coefficients actually mean.
          </li>
        </ul>

        <h3>Time series</h3>
        <ul>
          <li>
            <em>Forecasting: Principles and Practice</em> — Hyndman and Athanasopoulos. Free
            online, and the source of the discipline around benchmarks that chapter 7 follows.
          </li>
        </ul>

        <h3>Optimisation, simulation and decisions</h3>
        <ul>
          <li>
            <em>Introduction to Operations Research</em> — Hillier and Lieberman. The standard text
            for chapters 8, 10 and 13.
          </li>
          <li>
            <em>Simulation</em> — Sheldon Ross. A rigorous treatment of Monte Carlo methods,
            including the variance reduction this course only mentions.
          </li>
        </ul>

        <h3>Quality control and fraud detection</h3>
        <ul>
          <li>
            <em>Introduction to Statistical Quality Control</em> — Douglas Montgomery. The
            reference for chapter 14, including every control-chart constant.
          </li>
          <li>
            <em>Benford&rsquo;s Law</em> — Mark Nigrini. Where the MAD thresholds and the distortion
            factor in chapter 12 come from.
          </li>
        </ul>

        <h3>The tools</h3>
        <ul>
          <li>
            <a href="https://numpy.org/doc/stable/" rel="noreferrer noopener" target="_blank">
              NumPy
            </a>
            ,{" "}
            <a href="https://pandas.pydata.org/docs/" rel="noreferrer noopener" target="_blank">
              pandas
            </a>
            ,{" "}
            <a href="https://docs.scipy.org/doc/scipy/" rel="noreferrer noopener" target="_blank">
              SciPy
            </a>
            ,{" "}
            <a href="https://www.statsmodels.org/stable/" rel="noreferrer noopener" target="_blank">
              statsmodels
            </a>{" "}
            and{" "}
            <a href="https://scikit-learn.org/stable/" rel="noreferrer noopener" target="_blank">
              scikit-learn
            </a>{" "}
            all have documentation good enough to read for its own sake.
          </li>
          <li>
            <a href="https://pyodide.org" rel="noreferrer noopener" target="_blank">
              Pyodide
            </a>{" "}
            — the project that makes the runnable cells in this course possible.
          </li>
        </ul>
      </div>
    </div>
  );
}
