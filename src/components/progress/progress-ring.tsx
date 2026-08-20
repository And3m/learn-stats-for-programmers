"use client";

import { useProgress } from "@/components/progress/use-progress";
import { percentComplete } from "@/lib/progress";

/** A compact completion dial. Renders at 0% on the server and on the first
 *  client paint, then fills in once the store hydrates. */
export function ProgressRing({ lessonKeys, size = 34 }: { lessonKeys: string[]; size?: number }) {
  const progress = useProgress();
  const percent = percentComplete(progress, lessonKeys);
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      className="progress-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${percent}% complete`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--signal)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.28}
        fill="var(--muted)"
        fontFamily="var(--font-mono)"
      >
        {percent}
      </text>
    </svg>
  );
}
