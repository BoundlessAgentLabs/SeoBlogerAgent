import { getArticleBySlug, getArticleSlugs } from "@/super-page/data";

export const metadata = {
  title: "Generated SEO Articles",
  description: "Browse generated Super Page articles and preview-ready SEO workflows.",
};

export default function ArticlesIndexPage() {
  const articles = getArticleSlugs().flatMap((slug) => {
    const article = getArticleBySlug(slug);
    return article ? [{ slug: article.slug, title: article.metadata.title, description: article.metadata.description }] : [];
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Article index</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Generated SEO Super Pages</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Open the committed demo and generated workflow articles that pass schema, image, quality, and SEO readiness checks.</p>
      <div className="mt-10 space-y-4">
        {articles.map((article) => (
          <a key={article.slug} href={`/articles/${article.slug}`} className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-xl font-semibold text-slate-950">{article.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{article.description}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-slate-900">Read article →</span>
          </a>
        ))}
      </div>
    </main>
  );
}
