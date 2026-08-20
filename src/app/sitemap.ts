import type { MetadataRoute } from "next";

import { chapterHref, chapters, getAllLessons, lessonHref, siteUrl } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/chapters", "/glossary", "/formulas", "/playground", "/reading", "/license"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...chapters.map((chapter) => ({
      url: `${siteUrl}${chapterHref(chapter.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getAllLessons().map(({ chapter, lesson }) => ({
      url: `${siteUrl}${lessonHref(chapter.slug, lesson.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
