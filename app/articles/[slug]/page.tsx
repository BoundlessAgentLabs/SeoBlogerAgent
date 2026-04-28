import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SuperPageView } from "@/components/SuperPageView";
import { getArticleBySlug, getArticleSlugs } from "@/super-page/data";

export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getArticleBySlug(slug);
  if (!page) return {};

  return {
    title: page.metadata.title,
    description: page.metadata.description,
    alternates: { canonical: page.metadata.canonicalUrl },
    openGraph: {
      title: page.metadata.openGraph.title,
      description: page.metadata.openGraph.description,
      images: [page.metadata.openGraph.image],
      type: "article",
      modifiedTime: page.metadata.updatedAt,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getArticleBySlug(slug);
  if (!page) notFound();
  return <SuperPageView page={page} />;
}
