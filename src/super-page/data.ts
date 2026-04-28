import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { assertSuperPage } from "./validation";
import type { SuperPage } from "./types";

const articlesRoot = join(process.cwd(), "content", "articles");

function getArticleDirectories(): string[] {
  return readdirSync(articlesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("negative-"))
    .map((entry) => entry.name)
    .sort();
}

export function getArticleSlugs(): string[] {
  return getArticleDirectories().map((directory) => getArticleByDirectory(directory).slug);
}

export function getArticleByDirectory(directory: string): SuperPage {
  const articlePath = join(articlesRoot, directory, "article.json");
  const raw = JSON.parse(readFileSync(articlePath, "utf8"));
  return assertSuperPage(raw);
}

export function getArticleBySlug(slug: string): SuperPage | undefined {
  for (const directory of getArticleDirectories()) {
    const article = getArticleByDirectory(directory);
    if (article.slug === slug || directory === slug) {
      return article;
    }
  }
  return undefined;
}

export function getDefaultArticle(): SuperPage {
  return getArticleByDirectory("demo-super-page");
}
