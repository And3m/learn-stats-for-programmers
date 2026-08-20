import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const links: [label: string, href: string][] = [
  ["Chapters", "/chapters"],
  ["Playground", "/playground"],
  ["Glossary", "/glossary"],
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="site-header__brand">
          <span className="site-header__brand-mark">σ</span>
          Statistics for Programmers
        </Link>
        <nav className="site-header__nav" aria-label="Main">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="site-header__link">
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
