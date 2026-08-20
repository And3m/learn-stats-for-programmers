"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { glossaryHref, type GlossaryTerm } from "@/lib/glossary";

export function GlossaryList({ terms }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return terms;
    return terms.filter((entry) =>
      `${entry.term} ${entry.definition}`.toLowerCase().includes(needle),
    );
  }, [terms, query]);

  return (
    <>
      <div className="glossary-search">
        <input
          type="search"
          value={query}
          placeholder="Filter terms…"
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter glossary terms"
        />
        <p className="glossary-count" aria-live="polite">
          {filtered.length} of {terms.length} terms
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="glossary-empty">
          <p>No term matches &ldquo;{query.trim()}&rdquo;.</p>
          <button type="button" className="btn" onClick={() => setQuery("")}>
            Clear search
          </button>
        </div>
      ) : (
        <dl className="glossary">
          {filtered.map((entry) => {
            const href = glossaryHref(entry);
            return (
              <div className="glossary__entry" key={entry.term}>
                <dt className="glossary__term">
                  {href ? <Link href={href}>{entry.term}</Link> : entry.term}
                </dt>
                <dd className="glossary__definition">{entry.definition}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </>
  );
}
