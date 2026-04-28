import { getDefaultArticle } from "@/super-page/data";

export default function HomePage() {
  const page = getDefaultArticle();
  return (
    <main id="main" className="min-h-screen bg-paper px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">SeoBlogerAgent MVP</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight text-ink">Open-source SEO Super Pages with inspectable AI workflows</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">A working foundation for structured page planning, provider-neutral block rewriting, realistic image prompt metadata, SEO validation, and authoring UI review.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/workflow" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">Open authoring workflow</a>
            <a href={`/articles/${page.slug}`} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink">View rendered Super Page</a>
          </div>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {["Machine-readable Super Page schema", "Mock provider-neutral generation", "SEO metadata and quality gates"].map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-ink">{item}</h2>
              <p className="mt-2 text-sm text-muted">Implemented as executable project files instead of documentation-only notes.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
