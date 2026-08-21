import Link from "next/link";

import { AuthorLinks } from "@/components/author-links";
import { SearchDialog } from "@/components/search/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Deliberately minimal: brand, search, theme, author.
 *
 * Chapters / Playground / Glossary used to sit here. Primary navigation now
 * lives where the reader already is — the home page rail, the lesson sidebar,
 * and the footer — which keeps the header quiet on every page.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="site-header__brand">
          <span className="site-header__brand-mark">σ</span>
          Statistics for Programmers
        </Link>
        <nav className="site-header__nav" aria-label="Main">
          <SearchDialog />
          <ThemeToggle />
          <AuthorLinks />
        </nav>
      </div>
    </header>
  );
}
