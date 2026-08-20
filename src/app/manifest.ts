import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Statistics for Programmers",
    short_name: "Stats",
    description:
      "An interactive course in the statistics and quantitative methods programmers actually use, with real Python running in the page.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a5fb4",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
