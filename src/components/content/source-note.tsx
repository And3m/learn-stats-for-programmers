import { sourceBook } from "@/lib/content";

/** Cites the book this course takes its syllabus from. The course text is
 *  original; the citation points readers at the fuller treatment. */
export function SourceNote({ pages }: { pages?: string }) {
  return (
    <p className="source-note">
      Further reading:{" "}
      <a href={sourceBook.url} rel="noreferrer noopener" target="_blank">
        <em>{sourceBook.title}</em>
      </a>{" "}
      by {sourceBook.author} ({sourceBook.publisher}, {sourceBook.year})
      {pages ? `, pp. ${pages}` : null}.
    </p>
  );
}
