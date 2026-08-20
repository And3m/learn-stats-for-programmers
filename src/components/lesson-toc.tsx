import type { Lesson } from "@/lib/content";

/** The right rail. Section ids come from `content.ts` and must match the raw
 *  `<h2 id="...">` tags in the lesson's MDX. */
export function LessonToc({ lesson }: { lesson: Lesson }) {
  if (lesson.sections.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className="toc__label">On this page</p>
      <ul className="toc__list">
        {lesson.sections.map((section) => (
          <li key={section.id}>
            <a className="toc__link" href={`#${section.id}`}>
              {section.label}
              {section.sourcePages ? (
                <span className="toc__pages">pp. {section.sourcePages}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
      <p className="toc__aside">
        Further reading for this lesson: pp. {lesson.sourcePages}.
      </p>
    </nav>
  );
}
