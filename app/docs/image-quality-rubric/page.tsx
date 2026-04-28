import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Quality Rubric",
  description: "Relevance, realism, and text-artifact checks for AI-generated article images.",
};

export default function ImageQualityRubricPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-12 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8">
        <p className="audit-mono text-blue-700">Image QA</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Image quality rubric</h1>
        <p className="mt-5 text-slate-700">Generated article images are reviewed for topic relevance, realistic composition, absence of fake readable text, and useful captions/alt text.</p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-slate-700">
          <li>Pass images support the section intent without looking like generic stock photography.</li>
          <li>Warn states stay visible until an editor reviews relevance, text artifacts, or realism.</li>
          <li>Fail states require regeneration before publish-ready status.</li>
        </ul>
      </article>
    </main>
  );
}
