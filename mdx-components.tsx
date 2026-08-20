import type { MDXComponents } from "mdx/types";

import { Callout } from "@/components/content/callout";
import { Quiz } from "@/components/content/quiz";
import { SourceNote } from "@/components/content/source-note";
import { PythonCell } from "@/components/python/python-cell";

/** Components every MDX lesson can use without importing them. Anything
 *  heavier and lesson-specific — the interactive explorers — is imported per
 *  file so it only ships where it is actually used. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout,
    PythonCell,
    Quiz,
    SourceNote,
    ...components,
  };
}
