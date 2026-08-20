import type { Metadata } from "next";

import { PlaygroundClient } from "@/app/playground/playground-client";

import "../chapters/lesson.css";
import "../chapters/python.css";
import "./playground.css";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "A free-form Python scratchpad running numpy, pandas, scipy, matplotlib, scikit-learn and statsmodels entirely in your browser.",
};

export default function PlaygroundPage() {
  return (
    <div className="shell" style={{ maxWidth: "56rem", paddingBottom: "3rem" }}>
      <div className="chapter-hero">
        <p className="eyebrow">Scratchpad</p>
        <h1>Python playground.</h1>
        <p className="chapter-hero__overview">
          The same in-browser interpreter the lessons use, with nothing loaded in advance. Pick the
          libraries you want, write whatever you like, and run it. Nothing is uploaded anywhere.
        </p>
      </div>
      <PlaygroundClient />
    </div>
  );
}
