import type { SuperPage } from "@/super-page/types";

export function AuthoringWorkflow({ page }: { page: SuperPage }) {
  const failing = page.qualityGates.filter((gate) => gate.status === "fail");
  const warnings = page.qualityGates.filter((gate) => gate.status === "warn");
  const publishReady = failing.length === 0 && warnings.length === 0;

  return (
    <main id="main" className="min-h-screen bg-paper px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-ink p-8 text-white shadow-sm">
          <p className="text-sm font-medium text-blue-200">Open SEO writing workflow</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Generate inspectable Super Pages</h1>
          <p className="mt-4 max-w-3xl text-slate-200">This MVP shows the authoring workflow: topic input, structure review, block generation state, image prompt gallery, quality report, and rendered preview.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">1. Topic input</h2>
            <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="topic">Keyword or topic</label>
            <input id="topic" readOnly value={page.brief.keyword} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-ink" />
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-muted">
              <strong>Audience:</strong> {page.brief.audience}
              <br />
              <strong>Angle:</strong> {page.brief.angle}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">2. Structure review</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {page.sections.map((section, index) => (
                <div key={section.id} className="rounded-2xl border border-slate-200 p-4">
                  <span className="text-xs font-medium text-blue-700">Block {index + 1}</span>
                  <h3 className="mt-2 font-semibold text-ink">{section.heading}</h3>
                  <p className="mt-2 text-sm text-muted">{section.searchIntent}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">3. Generation state</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {page.sections.map((section) => (
              <div key={section.id} className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <strong>{section.id}</strong>
                <p className="mt-2">mock rewrite ready · {section.qualityNotes[0]}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">4. Image prompt gallery</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {page.imageSlots.map((slot) => (
              <article key={slot.id} className="rounded-2xl border border-slate-200 p-4">
                <img src={slot.assetPath} alt={slot.alt} className="h-44 w-full rounded-xl object-cover" />
                <h3 className="mt-4 font-semibold text-ink">{slot.purpose}</h3>
                <p className="mt-2 text-sm text-muted">{slot.prompt.subject}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1">{slot.provider}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{slot.status}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">relevance: {slot.qa.relevance}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">5. Publish readiness</h2>
              <p className="mt-2 text-sm text-muted">Failed QA checks must stay visible and block a false publish-ready state.</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${publishReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {publishReady ? "Publish ready" : "Needs review"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {page.qualityGates.map((gate) => (
              <div key={gate.id} className="rounded-2xl border border-slate-200 p-4">
                <strong>{gate.label}</strong>
                <p className="mt-2 text-sm text-muted">{gate.status.toUpperCase()} · {gate.evidence}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`/articles/${page.slug}`} className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">Open rendered preview</a>
          <a href="/" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-ink">Back to home</a>
        </div>
      </div>
    </main>
  );
}
