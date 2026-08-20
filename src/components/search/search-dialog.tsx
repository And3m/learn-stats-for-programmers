"use client";

import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildSearchIndex, KIND_LABEL, type SearchEntry } from "@/lib/search-index";

const RESULT_LIMIT = 12;

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(buildSearchIndex(), {
        keys: [
          { name: "title", weight: 3 },
          { name: "context", weight: 1 },
          { name: "body", weight: 1 },
        ],
        threshold: 0.34,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [],
  );

  const results = useMemo<SearchEntry[]>(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return fuse.search(trimmed, { limit: RESULT_LIMIT }).map((hit) => hit.item);
  }, [fuse, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (entry: SearchEntry) => {
      close();
      router.push(entry.href);
    },
    [close, router],
  );

  // ⌘K / Ctrl+K anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search the course"
      >
        <Search size={14} aria-hidden />
        <span className="search-trigger__label">Search</span>
        <kbd className="search-trigger__kbd">⌘K</kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="search-dialog"
        onClose={close}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        aria-label="Search"
      >
        <div className="search-dialog__panel">
          <div className="search-dialog__field">
            <Search size={16} aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Search chapters, lessons, sections and terms…"
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              aria-label="Search query"
              autoComplete="off"
            />
            <kbd className="search-trigger__kbd">esc</kbd>
          </div>

          {query.trim().length >= 2 ? (
            results.length > 0 ? (
              <ul className="search-results" aria-live="polite">
                {results.map((entry, index) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className="search-result"
                      data-active={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(entry)}
                    >
                      <span className="search-result__kind">{KIND_LABEL[entry.kind]}</span>
                      <span className="search-result__body">
                        <span className="search-result__title">{entry.title}</span>
                        <span className="search-result__context">{entry.context}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="search-empty" aria-live="polite">
                Nothing matches &ldquo;{query.trim()}&rdquo;.
              </p>
            )
          ) : (
            <p className="search-empty">
              Type at least two characters. Use ↑ and ↓ to move, ↵ to open.
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
