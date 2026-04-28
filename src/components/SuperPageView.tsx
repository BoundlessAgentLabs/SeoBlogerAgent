import type { QualityStatus, SuperPage } from "@/super-page/types";
import { articleJsonLd, breadcrumbJsonLd } from "@/seo/jsonLd";

function statusClass(status: QualityStatus) {
  if (status === "pass") return "border-emerald-500 text-emerald-800";
  if (status === "warn") return "border-amber-500 text-amber-800";
  return "border-red-500 text-red-800";
}

export function SuperPageView({ page }: { page: SuperPage }) {
  const imagesById = new Map(page.imageSlots.map((slot) => [slot.id, slot]));

  return (
    <main id="main" className="min-h-screen bg-paper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(page)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(page)) }} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div>
            <p className="mb-4 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 audit-mono text-blue-700">
              {page.brief.intent} intent · {page.brief.sourceModel}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-6xl">{page.hero.headline}</h1>
            <p className="mt-6 text-lg leading-8 text-slate-700">{page.hero.answer}</p>
            <ul className="mt-8 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              {page.hero.summaryBullets.map((bullet) => (
                <li key={bullet} className="rounded-lg border border-slate-200 bg-slate-50 p-4">{bullet}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">{page.hero.trustCue}</p>
          </div>
          <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img src={page.imageSlots[0]?.assetPath ?? page.metadata.openGraph.image} alt={page.imageSlots[0]?.alt ?? page.hero.headline} className="h-full min-h-80 w-full object-cover" />
            <figcaption className="border-t border-slate-200 bg-white px-5 py-3 text-sm text-muted">{page.imageSlots[0]?.caption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold text-ink">On this page</h2>
          <nav className="mt-4 grid gap-2 text-sm text-muted">
            {page.toc.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="rounded-lg px-3 py-2 hover:bg-slate-50 hover:text-ink">{item.label}</a>
            ))}
          </nav>
        </aside>

        <article className="grid gap-8">
          {page.sections.map((section) => {
            const image = imagesById.get(section.imageSlotId);
            return (
              <section id={section.id} key={section.id} className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
                <p className="audit-mono text-blue-700">Intent: {section.searchIntent}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{section.heading}</h2>
                <p className="mt-4 rounded-lg border-l-4 border-blue-500 bg-white p-4 text-blue-900">{section.summaryClaim}</p>
                <div className="prose prose-slate mt-6 max-w-none">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {image ? (
                  <figure className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img src={image.assetPath} alt={image.alt} className="max-h-96 w-full object-cover" />
                    <figcaption className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-muted">{image.caption}</figcaption>
                  </figure>
                ) : null}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="border-l-4 border-emerald-500 bg-white p-4 text-sm text-emerald-900">
                    <strong>Example</strong>
                    <ul className="mt-2 list-disc pl-5">{section.examples.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div className="border-l-4 border-amber-500 bg-white p-4 text-sm text-amber-900">
                    <strong>Caveat</strong>
                    <ul className="mt-2 list-disc pl-5">{section.caveats.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
                <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer audit-mono text-slate-700">Show generation audit</summary>
                  <div className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
                    <div>
                      <h3 className="font-semibold text-ink">Constraints</h3>
                      <ul className="mt-2 list-disc pl-5">{section.generationConstraints.mustInclude.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink">Source notes</h3>
                      <ul className="mt-2 list-disc pl-5">{section.sourceNotes.map((note) => <li key={`${note.label}-${note.note}`}>{note.label}: {note.note}</li>)}</ul>
                    </div>
                    {image ? (
                      <div>
                        <h3 className="font-semibold text-ink">Image prompt</h3>
                        <dl className="mt-2 grid gap-1">
                          <div><dt className="font-medium">Subject</dt><dd>{image.prompt.subject}</dd></div>
                          <div><dt className="font-medium">Composition</dt><dd>{image.prompt.composition}</dd></div>
                          <div><dt className="font-medium">Avoid</dt><dd>{image.prompt.avoid.join(" · ")}</dd></div>
                        </dl>
                      </div>
                    ) : null}
                  </div>
                </details>
              </section>
            );
          })}

          <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
            <h2 className="text-3xl font-semibold text-ink">Quality report</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {page.qualityGates.map((gate) => (
                <div key={gate.id} className={`border-l-4 bg-white p-4 ${statusClass(gate.status)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <strong>{gate.label}</strong>
                    <span className="audit-mono">[{gate.status.toUpperCase()}]</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{gate.evidence}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
            <h2 className="text-3xl font-semibold text-ink">FAQ</h2>
            <div className="mt-5 divide-y divide-slate-200">
              {page.faq.map((item) => (
                <div key={item.question} className="py-5">
                  <h3 className="font-semibold text-ink">{item.question}</h3>
                  <p className="mt-2 text-slate-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
            <h2 className="text-3xl font-semibold text-ink">Internal links</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {page.internalLinks.map((link) => (
                <a key={link.href} href={link.href} className="rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50">
                  <strong>{link.anchor}</strong>
                  <p className="mt-2 text-sm text-muted">{link.purpose}</p>
                </a>
              ))}
            </div>
          </section>
        </article>
      </section>
    </main>
  );
}
