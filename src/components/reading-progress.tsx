"use client";

import { useEffect, useState } from "react";

/** The 2px bar under the header showing how far down the article you are. */
export function ReadingProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setPercent(scrollable <= 0 ? 0 : Math.min(100, (window.scrollY / scrollable) * 100));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <div className="reading-progress" style={{ width: `${percent}%` }} aria-hidden />;
}
