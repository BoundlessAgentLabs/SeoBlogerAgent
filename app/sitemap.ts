import type { MetadataRoute } from "next";
import { getArticleSlugs, getArticleBySlug } from "@/super-page/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://example.com", lastModified: new Date("2026-04-28") },
    { url: "https://example.com/workflow", lastModified: new Date("2026-04-28") },
  ];

  const articles = getArticleSlugs().flatMap((slug) => {
    const article = getArticleBySlug(slug);
    return article ? [{ url: article.metadata.canonicalUrl, lastModified: new Date(article.metadata.updatedAt) }] : [];
  });

  return [...staticRoutes, ...articles];
}
