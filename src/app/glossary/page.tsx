import type { Metadata } from "next";

import { GlossaryList } from "@/components/glossary-list";
import { glossary } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Every statistical term used in the course, defined plainly and linked to the lesson that introduces it.",
};

export default function GlossaryPage() {
  return (
    <div className="shell" style={{ maxWidth: "56rem", paddingBottom: "3rem" }}>
      <div className="chapter-hero">
        <p className="eyebrow">Reference</p>
        <h1>Glossary.</h1>
        <p className="chapter-hero__overview">
          {glossary.length} terms, each defined in the sense this course uses it and linked to the
          lesson where it is introduced. Definitions aim to be usable rather than exhaustive — the
          point is to remind, not to replace the lesson.
        </p>
      </div>

      <GlossaryList terms={glossary} />
    </div>
  );
}
