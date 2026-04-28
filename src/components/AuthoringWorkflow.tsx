"use client";

import { useMemo, useState } from "react";
import type { QualityStatus, SuperPage } from "@/super-page/types";

type StepState = "idle" | "running" | "done" | "blocked";
type EventPhase = "structure" | "blocks" | "images" | "system";

interface AuditEvent {
  time: string;
  phase: EventPhase;
  message: string;
}

function nowStamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function nextTopicPlan(topic: string, page: SuperPage) {
  const safeTopic = topic.trim() || page.brief.keyword;
  return page.sections.map((section, index) => ({
    ...section,
    heading: index === 0 ? `Plan the Super Page for ${safeTopic}` : section.heading,
    searchIntent: index === 0 ? `Understand how ${safeTopic} should be structured before generation.` : section.searchIntent,
  }));
}

function stateClass(state: StepState) {
  if (state === "done") return "border-emerald-500 bg-white text-emerald-800";
  if (state === "running") return "border-blue-500 bg-blue-50 text-blue-800";
  if (state === "blocked") return "border-red-500 bg-red-50 text-red-800";
  return "border-slate-300 bg-slate-50 text-slate-600";
}

function qualityClass(status: QualityStatus) {
  if (status === "pass") return "border-emerald-500 text-emerald-800";
  if (status === "warn") return "border-amber-500 text-amber-800";
  return "border-red-500 text-red-800";
}

function statusLabel(status: QualityStatus) {
  return `[${status.toUpperCase()}]`;
}

export function AuthoringWorkflow({ page }: { page: SuperPage }) {
  const fixtureId = `${page.slug}@${page.schemaVersion}`;
  const [topic, setTopic] = useState(page.brief.keyword);
  const [structureState, setStructureState] = useState<StepState>("idle");
  const [blockState, setBlockState] = useState<StepState>("idle");
  const [imageState, setImageState] = useState<StepState>("idle");
  const [sections, setSections] = useState(page.sections);
  const [events, setEvents] = useState<AuditEvent[]>([
    { time: nowStamp(), phase: "system", message: `Loaded deterministic fixture ${fixtureId}.` },
  ]);

  const imageWarnings = page.imageSlots.filter((slot) => slot.qa.relevance !== "pass" || slot.qa.textArtifacts !== "pass" || slot.qa.realism !== "pass");
  const failing = page.qualityGates.filter((gate) => gate.status === "fail");
  const warningCount = page.qualityGates.filter((gate) => gate.status === "warn").length + imageWarnings.length;
  const publishReady = structureState === "done" && blockState === "done" && imageState === "done" && failing.length === 0 && warningCount === 0;

  const generatedStatus = useMemo(() => sections.map((section) => ({
    id: section.id,
    heading: section.heading,
    status: blockState === "done" ? "done" : blockState === "running" ? "running" : "idle" as StepState,
    sources: section.sourceNotes.length,
    constraints: section.generationConstraints.mustInclude.length,
    note: blockState === "done" ? "Shared contract output persisted" : section.qualityNotes[0],
  })), [sections, blockState]);

  function log(phase: EventPhase, message: string) {
    setEvents((current) => [{ time: nowStamp(), phase, message }, ...current].slice(0, 12));
  }

  function generateStructure() {
    setStructureState("running");
    log("structure", `Started structure generation for topic: ${topic}`);
    window.setTimeout(() => {
      const planned = nextTopicPlan(topic, page);
      setSections(planned);
      setStructureState("done");
      setBlockState("idle");
      setImageState("idle");
      log("structure", `Generated ${planned.length} editable section blocks.`);
    }, 500);
  }

  function generateBlocks() {
    if (structureState !== "done") {
      setBlockState("blocked");
      log("blocks", "Locked: complete structure generation first.");
      return;
    }
    setBlockState("running");
    log("blocks", "Started deterministic block generation through shared provider contract.");
    window.setTimeout(() => {
      setSections((current) => current.map((section) => ({
        ...section,
        qualityNotes: [`Executable mock rewrite ready with source-grounded constraints for ${topic}.`],
      })));
      setBlockState("done");
      setImageState("idle");
      log("blocks", `Generated all ${sections.length} section blocks with source notes and constraints.`);
    }, 650);
  }

  function prepareImages() {
    if (blockState !== "done") {
      setImageState("blocked");
      log("images", "Locked: generate blocks before preparing image prompts.");
      return;
    }
    setImageState("running");
    log("images", "Started image prompt QA and regeneration planning.");
    window.setTimeout(() => {
      setImageState("done");
      log("images", `Prepared ${page.imageSlots.length} image prompt records and QA states.`);
    }, 550);
  }

  const pipeline = [
    { label: "Topic", state: topic.trim() ? "done" : "idle" as StepState },
    { label: "Structure", state: structureState },
    { label: "Blocks", state: blockState },
    { label: "Images", state: imageState },
  ];

  return (
    <main id="main" className="min-h-screen bg-paper px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-slate-800 bg-ink p-8 text-white">
          <p className="audit-mono text-blue-200">Open SEO writing workflow</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Generate inspectable Super Pages</h1>
          <p className="mt-4 max-w-3xl text-slate-200">Edit a topic, generate structure, generate blocks, prepare image prompts, and audit quality state without proprietary competitor assets.</p>
          <a href={`/workflow/preview/${page.slug}`} className="mt-5 inline-flex rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-white hover:border-white">Open persisted generated preview</a>
          <div className="mt-6 grid gap-2 sm:grid-cols-4">
            {pipeline.map((step, index) => (
              <div key={step.label} className={`border-l-4 p-3 ${stateClass(step.state)}`}>
                <span className="audit-mono">{index + 1}. {step.label}</span>
                <p className="audit-mono mt-1">{step.state}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-ink">1. Topic input</h2>
            <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="topic">Keyword or topic</label>
            <input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-ink" />
            <button type="button" onClick={generateStructure} disabled={structureState === "running"} className="mt-4 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">Generate structure</button>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-muted">
              <strong>Audience:</strong> {page.brief.audience}
              <br />
              <strong>Structure state:</strong> <span className="audit-mono">{structureState}</span>
            </div>
            <div className="mt-4 border-l-4 border-blue-500 bg-white p-4">
              <h3 className="font-semibold text-ink">Deterministic contract</h3>
              <dl className="mt-3 grid gap-2 text-sm text-muted">
                <div><dt className="inline font-medium text-slate-700">Fixture</dt><dd className="ml-2 inline audit-mono">{fixtureId}</dd></div>
                <div><dt className="inline font-medium text-slate-700">Source model</dt><dd className="ml-2 inline audit-mono">{page.brief.sourceModel}</dd></div>
                <div><dt className="inline font-medium text-slate-700">Schema</dt><dd className="ml-2 inline">Outputs are reproducible from the shared Super Page schema.</dd></div>
              </dl>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-ink">2. Structure review</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {sections.map((section, index) => (
                <div key={section.id} className="rounded-lg border border-slate-200 p-4">
                  <span className="audit-mono text-blue-700">Block {index + 1}</span>
                  <h3 className="mt-2 font-semibold text-ink">{section.heading}</h3>
                  <p className="mt-2 text-sm text-muted">{section.searchIntent}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">3. Block generation state</h2>
              {structureState !== "done" ? <p className="mt-1 text-sm text-amber-700">Locked: complete structure generation first.</p> : null}
            </div>
            <button type="button" onClick={generateBlocks} disabled={structureState !== "done" || blockState === "running"} className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">Generate blocks</button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {generatedStatus.map((item) => (
              <div key={item.id} className={`border-l-4 p-4 ${stateClass(item.status)}`}>
                <div className="flex items-center justify-between gap-3">
                  <strong>{item.heading}</strong>
                  <span className="audit-mono">{item.status === "running" ? "Running…" : item.status === "idle" ? "waiting" : item.status}</span>
                </div>
                <p className="audit-mono mt-2">Sources: {item.sources} · Constraints: {item.constraints}</p>
                <p className="mt-2 text-sm text-muted">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">4. Image prompt gallery</h2>
                {blockState !== "done" ? <p className="mt-1 text-sm text-amber-700">Locked: generate blocks before preparing image prompts.</p> : null}
              </div>
              <button type="button" onClick={prepareImages} disabled={blockState !== "done" || imageState === "running"} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">Prepare image prompts</button>
            </div>
            <div className="mt-5 grid gap-4">
              {page.imageSlots.map((slot) => (
                <div key={slot.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-ink">{slot.purpose}</h3>
                    <span className="audit-mono">{slot.status}</span>
                  </div>
                  <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer audit-mono text-slate-700">Show prompt metadata</summary>
                    <dl className="mt-3 grid gap-2 text-sm text-slate-700">
                      <div><dt className="font-medium">Subject</dt><dd>{slot.prompt.subject}</dd></div>
                      <div><dt className="font-medium">Context</dt><dd>{slot.prompt.context}</dd></div>
                      <div><dt className="font-medium">Composition</dt><dd>{slot.prompt.composition}</dd></div>
                      <div><dt className="font-medium">Realism constraints</dt><dd>{slot.prompt.realismConstraints.join(" · ")}</dd></div>
                      <div><dt className="font-medium">Avoid</dt><dd>{slot.prompt.avoid.join(" · ")}</dd></div>
                    </dl>
                  </details>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["relevance", "textArtifacts", "realism"] as const).map((key) => (
                      <span key={key} className={`audit-mono border-l-4 bg-white px-2 py-1 ${qualityClass(slot.qa[key])}`}>{key}: {slot.qa[key]}</span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted">{slot.qa.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">Quality report</h2>
                <p className="mt-2 text-sm text-muted">Structure: {structureState} · Blocks: {blockState} · Images: {imageState} · {failing.length} failing gates · {warningCount} warnings</p>
              </div>
              <span className={`audit-mono border-l-4 bg-white px-3 py-2 ${publishReady ? "border-emerald-500 text-emerald-800" : "border-amber-500 text-amber-800"}`}>{publishReady ? "Publish ready" : "Needs review"}</span>
            </div>
            <h3 className="mt-5 font-semibold text-ink">Page quality gates</h3>
            <div className="mt-3 grid gap-3">
              {page.qualityGates.map((gate) => (
                <div key={gate.id} className={`border-l-4 bg-white p-3 ${qualityClass(gate.status)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <strong>{gate.label}</strong>
                    <span className="audit-mono">{statusLabel(gate.status)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{gate.evidence}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-5 font-semibold text-ink">Image QA</h3>
            <div className="mt-3 grid gap-3">
              {page.imageSlots.map((slot) => (
                <div key={slot.id} className="border-l-4 border-slate-300 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{slot.purpose}</strong>
                    <span className="audit-mono">relevance {slot.qa.relevance} · text {slot.qa.textArtifacts} · realism {slot.qa.realism}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{slot.qa.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-ink">Audit trail</h2>
          <div className="mt-4 grid gap-2">
            {events.map((event) => (
              <div key={`${event.time}-${event.message}`} className="grid gap-2 border-l-4 border-slate-300 bg-slate-50 p-3 sm:grid-cols-[180px_100px_1fr]">
                <span className="audit-mono">{event.time}</span>
                <span className="audit-mono uppercase text-blue-700">{event.phase}</span>
                <span className="text-sm text-slate-700">{event.message}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
