import { PyodideProvider } from "@/components/python/pyodide-provider";

import "./lesson.css";
import "./python.css";

/** Scopes the lesson stylesheets to /chapters and hoists the Python runtime so
 *  every cell on a page shares one warm interpreter. */
export default function ChaptersLayout({ children }: { children: React.ReactNode }) {
  return <PyodideProvider>{children}</PyodideProvider>;
}
