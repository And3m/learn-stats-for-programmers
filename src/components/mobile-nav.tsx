"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { chapterHref, chapters, lessonHref } from "@/lib/content";

const siteLinks: [label: string, href: string][] = [
  ["All chapters", "/chapters"],
  ["Playground", "/playground"],
  ["Glossary", "/glossary"],
  ["Formulas", "/formulas"],
  ["Further reading", "/reading"],
];

/**
 * Navigation for narrow screens.
 *
 * The header carries no links and the lesson sidebar is hidden below 820px, so
 * without this a phone reader has only the prev/next pager and the footer. It
 * lists the site links and every chapter, and expands the lessons of whichever
 * chapter the reader is currently in — which is the level they actually need.
 *
 * Chapters come straight from `content.ts` rather than props, so this works on
 * every route, including the ones with no chapter context at all.
 */
export function MobileNav() {
  const pathname = usePathname();
  /**
   * Which route the panel was opened on. Deriving `open` from it closes the
   * panel the moment navigation happens — otherwise it would sit over the new
   * page — without an effect that sets state on every route change.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt !== null && openedAt === pathname;
  const setOpen = (next: boolean) => setOpenedAt(next ? pathname : null);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // `setOpenedAt` rather than the `setOpen` helper: the setter is stable, so
    // the effect does not re-subscribe on every render.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedAt(null);
    };

    // Captured now: by cleanup time the ref may point somewhere else.
    const opener = openerRef.current;
    const { overflow } = document.body.style;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [open]);

  const currentChapter = chapters.find((chapter) =>
    pathname.startsWith(chapterHref(chapter.slug)),
  );

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className="icon-button mobile-nav__opener"
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Menu size={16} aria-hidden />
      </button>

      {open ? (
        <div className="mobile-nav">
          <button
            type="button"
            className="mobile-nav__scrim"
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            className="mobile-nav__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="mobile-nav__bar">
              <span className="eyebrow">Navigate</span>
              <button
                ref={closeRef}
                type="button"
                className="icon-button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            <nav className="mobile-nav__body" aria-label="Site">
              <ul className="mobile-nav__list">
                {siteLinks.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      className="mobile-nav__link"
                      href={href}
                      aria-current={pathname === href ? "page" : undefined}
                    >
                      {label}
                      <ChevronRight size={14} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="eyebrow mobile-nav__heading">Chapters</p>
              <ol className="mobile-nav__list">
                {chapters.map((chapter) => {
                  const isCurrent = chapter.slug === currentChapter?.slug;
                  return (
                    <li key={chapter.slug}>
                      <Link
                        className="mobile-nav__link"
                        href={chapterHref(chapter.slug)}
                        aria-current={isCurrent ? "true" : undefined}
                      >
                        <span className="mobile-nav__number">
                          {String(chapter.number).padStart(2, "0")}
                        </span>
                        {chapter.shortTitle}
                      </Link>

                      {isCurrent ? (
                        <ol className="mobile-nav__lessons">
                          {chapter.lessons.map((item) => {
                            const href = lessonHref(chapter.slug, item.slug);
                            return (
                              <li key={item.slug}>
                                <Link
                                  className="mobile-nav__lesson"
                                  href={href}
                                  aria-current={pathname === href ? "page" : undefined}
                                >
                                  <span className="mobile-nav__number">{item.number}</span>
                                  {item.shortTitle}
                                </Link>
                              </li>
                            );
                          })}
                        </ol>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
