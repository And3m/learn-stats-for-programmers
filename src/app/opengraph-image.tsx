import { ImageResponse } from "next/og";

import { courseStats } from "@/lib/content";

export const alt = "Statistics for Programmers — an interactive course";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const stats = courseStats();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d1117",
          color: "#f5f8fa",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#62a0ea",
              marginBottom: 28,
            }}
          >
            An interactive course
          </div>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.02,
              letterSpacing: -3,
              maxWidth: 900,
            }}
          >
            The statistics programmers actually use.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 56 }}>
            {[
              [String(stats.chapters), "chapters"],
              [String(stats.lessons), "lessons"],
              ["Python", "in the browser"],
            ].map(([value, label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 46, color: "#f5f8fa" }}>{value}</div>
                <div style={{ fontSize: 20, color: "#93a1b0", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {["#62a0ea", "#ff7800", "#57e389", "#f66fd8", "#f8e45c"].map((colour) => (
              <div
                key={colour}
                style={{ width: 34, height: 34, borderRadius: 17, background: colour }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
