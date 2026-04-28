import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SuperPageView } from "@/components/SuperPageView";
import { getGeneratedArticlePreview, getGeneratedPreviewSlugs } from "@/super-page/data";

export function generateStaticParams() {
  return getGeneratedPreviewSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getGeneratedArticlePreview(slug);
  if (!page) return {};
  return {
    title: `Generated preview: ${page.metadata.title}`,
    description: page.metadata.description,
    robots: { index: false, follow: false },
  };
}

export default async function GeneratedPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getGeneratedArticlePreview(slug);
  if (!page) notFound();
  return <SuperPageView page={page} />;
}
