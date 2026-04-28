import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Page Schema Reference",
  description: "Required blocks and validation rules for the open SEO Super Page content model.",
};

export default function SuperPageSchemaPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-12 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8">
        <p className="audit-mono text-blue-700">Schema reference</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Super Page schema reference</h1>
        <p className="mt-5 text-slate-700">A Super Page is stored as structured JSON with metadata, hero answer, table of contents, section blocks, FAQ, internal links, image slots, breadcrumbs, and quality gates.</p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-slate-700">
          <li>Every section must map to a TOC entry and an image slot.</li>
          <li>Image slots require descriptive alt text, captions, prompt metadata, and QA status.</li>
          <li>Breadcrumb and canonical paths must match the article slug.</li>
        </ul>
      </article>
    </main>
  );
}
