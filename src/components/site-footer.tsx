import Link from "next/link";

import { sourceBook } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <p style={{ margin: 0, maxWidth: "34rem" }}>
          An independent, original course. Its syllabus follows{" "}
          <a href={sourceBook.url} rel="noreferrer noopener" target="_blank">
            <em>{sourceBook.title}</em>
          </a>{" "}
          by {sourceBook.author} ({sourceBook.publisher}, {sourceBook.year}), which is recommended
          as further reading. No text, figures or code from the book are reproduced here.
        </p>
        <nav className="site-footer__links" aria-label="Footer">
          <Link href="/chapters">Chapters</Link>
          <Link href="/glossary">Glossary</Link>
          <Link href="/formulas">Formulas</Link>
          <Link href="/playground">Playground</Link>
          <Link href="/reading">Further reading</Link>
          <Link href="/license">License</Link>
        </nav>
      </div>
    </footer>
  );
}
