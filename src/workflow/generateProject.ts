import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateWithModel, promptForPage, promptForSection } from "@/models/gateway";
import type { OutlineOutput, ReviewOutput, SectionRewriteOutput } from "@/models/validation";
import { imagePromptRecord } from "@/images/prompt";
import { generateMockImage } from "@/images/adapter";
import { validateSeoReadiness } from "@/seo/validation";
import { reviewPageContentQuality, reviewSectionQuality, qualityStatusFromIssues } from "@/quality/content";
import { assertSuperPage } from "@/super-page/validation";
import type { SuperPage } from "@/super-page/types";

export interface WorkflowAuditEvent {
  time: string;
  phase: "structure" | "blocks" | "images" | "system";
  message: string;
}

export interface WorkflowProjectInput {
  topic: string;
  customerAction?: string;
  targetLocation?: string;
  brandVoice?: string;
  imageModelPreference?: string;
}

export interface WorkflowProjectResult {
  slug: string;
  directory: string;
  previewPath: string;
  articlePath: string;
  generatedAt: string;
  article: SuperPage;
  events: WorkflowAuditEvent[];
  quality: {
    valid: boolean;
    failingGates: number;
    warnings: number;
    seoErrors: string[];
    contentIssues: number;
  };
}

interface SectionLog {
  sectionId: string;
  promptIds: string[];
  rewrite: Awaited<ReturnType<typeof generateWithModel<SectionRewriteOutput>>>;
  generatedSection: Pick<SuperPage["sections"][number], "paragraphs" | "examples" | "caveats" | "qualityNotes">;
  reviews: {
    factReview: Awaited<ReturnType<typeof generateWithModel<ReviewOutput>>>;
    toneReview: Awaited<ReturnType<typeof generateWithModel<ReviewOutput>>>;
    statReview: Awaited<ReturnType<typeof generateWithModel<ReviewOutput>>>;
    citationReview: Awaited<ReturnType<typeof generateWithModel<ReviewOutput>>>;
    computedIssues: ReturnType<typeof reviewSectionQuality>;
  };
  qualityStatus: ReturnType<typeof qualityStatusFromIssues>;
}

function topicHash(topic: string) {
  return createHash("sha1").update(topic.trim()).digest("hex").slice(0, 8);
}

function slugifyTopic(topic: string) {
  const source = topic.trim().toLowerCase();
  const fullSlug = source.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const hash = topicHash(topic);
  const containsNonAscii = /[^\u0000-\u007f]/.test(source);
  if (!fullSlug) return `topic-${hash}`;
  if (containsNonAscii || fullSlug.length > 44) return `${fullSlug.slice(0, 44).replace(/-+$/g, "")}-${hash}`;
  return fullSlug;
}

function compactText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function limitText(input: string, maxLength: number) {
  const compact = compactText(input);
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function workflowMetadataTitle(topicTitle: string) {
  return limitText(`${topicTitle}: Inspectable SEO Super Page Workflow`, 70);
}

function workflowMetadataDescription(topicText: string) {
  return limitText(`Generated Super Page workflow for ${topicText}: structure, block rewrites, image prompts, quality checks, and SEO preview.`, 170);
}

function isoNow() {
  return new Date().toISOString();
}

function event(phase: WorkflowAuditEvent["phase"], message: string): WorkflowAuditEvent {
  return { time: isoNow().replace(/\.\d{3}Z$/, "Z"), phase, message };
}

function titleCase(input: string) {
  return input.replace(/\w\S*/g, (word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`);
}

function normalizeWorkflowInput(input: string | WorkflowProjectInput): WorkflowProjectInput {
  return typeof input === "string" ? { topic: input } : input;
}

function workflowInstructionSummary(input: WorkflowProjectInput) {
  return [
    input.customerAction ? `Desired action: ${input.customerAction}` : "Desired action: review and improve the page before publishing",
    input.targetLocation ? `Target location: ${input.targetLocation}` : "Target location: global/default",
    input.brandVoice ? `Brand voice: ${input.brandVoice}` : "Brand voice: helpful expert",
    input.imageModelPreference ? `Image model: ${input.imageModelPreference}` : "Image model: default mock/live adapter",
  ].join("; ");
}

function generatedDate() {
  return isoNow().slice(0, 10);
}

function topicArticleFromTemplate(template: SuperPage, input: WorkflowProjectInput): SuperPage {
  const topicText = input.topic.trim() || template.brief.keyword;
  const instructionSummary = workflowInstructionSummary(input);
  const topicTitle = titleCase(topicText);
  const slug = `generated-${slugifyTopic(topicText)}`;
  const canonicalUrl = `https://example.com/articles/${slug}`;
  const article = JSON.parse(JSON.stringify(template)) as SuperPage;
  article.slug = slug;
  article.brief.keyword = topicText;
  article.brief.angle = `Open, inspectable Super Page workflow for ${topicText}. ${instructionSummary}`;
  article.metadata.title = workflowMetadataTitle(topicTitle);
  article.metadata.description = workflowMetadataDescription(topicText);
  article.metadata.canonicalUrl = canonicalUrl;
  article.metadata.updatedAt = generatedDate();
  article.metadata.openGraph.title = article.metadata.title;
  article.metadata.openGraph.description = article.metadata.description;
  article.breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Articles", href: "/articles" },
    { name: article.metadata.title, href: `/articles/${slug}` },
  ];
  article.hero.headline = `Build a Super Page for ${topicTitle}`;
  article.hero.answer = `This persisted workflow turns ${topicText} into a structured Super Page plan with generated sections, image prompts, quality checks, and operator instructions: ${instructionSummary}.`;
  article.hero.summaryBullets = [
    `Topic-specific structure for ${topicText}`,
    "Section rewrites stay linked to source notes and constraints",
    "Image prompt metadata is persisted with QA state",
    "Quality and SEO validation are visible before preview",
  ];
  article.toc = article.sections.map((section) => ({ id: section.id, label: section.heading }));
  article.sections = article.sections.map((section, index) => ({
    ...section,
    heading: index === 0 ? `Structure the ${topicTitle} Super Page` : section.heading.replace("AI SEO", topicTitle),
    searchIntent: index === 0 ? `Understand what a useful ${topicText} Super Page should cover before drafting.` : section.searchIntent.replace("AI SEO", topicTitle),
    summaryClaim: section.summaryClaim.replace("AI SEO", topicTitle).replace("Super Page", `${topicTitle} Super Page`),
    sourceNotes: section.sourceNotes.map((note) => ({ ...note, note: `${note.note} Applied to the submitted topic: ${topicText}. ${instructionSummary}.` })),
    qualityNotes: [`Waiting for persisted generation for ${topicText}.`],
  }));
  article.toc = article.sections.map((section) => ({ id: section.id, label: section.heading }));
  article.imageSlots = article.imageSlots.map((slot) => ({
    ...slot,
    provider: "mock",
    status: "mock",
    assetPath: `/mock-images/${slot.id}.svg`,
    prompt: {
      ...slot.prompt,
      context: `${slot.prompt.context}. Topic: ${topicText}. ${instructionSummary}.`,
    },
    qa: {
      ...slot.qa,
      notes: `Persisted mock image prompt prepared for ${topicText}; live generation can replace this asset explicitly.`,
    },
  }));
  return article;
}

function assertValidResponse(label: string, response: { validation: { valid: boolean; errors: string[] } }) {
  if (!response.validation.valid) throw new Error(`${label} failed output validation:\n${response.validation.errors.join("\n")}`);
}

export async function buildGeneratedProject(template: SuperPage, workflowInput: string | WorkflowProjectInput): Promise<{ article: SuperPage; outline: Awaited<ReturnType<typeof generateWithModel<OutlineOutput>>>; sectionLogs: SectionLog[]; imageMetadata: Awaited<ReturnType<typeof generateMockImage>>[]; qualityReport: unknown; events: WorkflowAuditEvent[] }> {
  const input = normalizeWorkflowInput(workflowInput);
  const events = [event("system", `Started persisted workflow for topic: ${input.topic}`)];
  const article = topicArticleFromTemplate(template, input);
  const outlinePrompt = promptForPage("outline", article);
  const outline = await generateWithModel<OutlineOutput>({
    task: "outline",
    input: outlinePrompt.user,
    prompt: outlinePrompt,
    context: { page: article, expectedOutlineIds: article.sections.map((section) => section.id) },
    mode: "mock",
  });
  assertValidResponse("outline", outline);
  events.push(event("structure", `Persisted outline matched ${outline.output.sections.length} Super Page sections.`));

  const generatedSections: SuperPage["sections"] = [];
  const sectionLogs: SectionLog[] = [];
  for (const section of article.sections) {
    const rewritePrompt = promptForSection("section-rewrite", article, section);
    const rewrite = await generateWithModel<SectionRewriteOutput>({ task: "section-rewrite", input: rewritePrompt.user, prompt: rewritePrompt, context: { section, sectionId: section.id, keyword: article.brief.keyword }, mode: "mock" });
    assertValidResponse(`rewrite:${section.id}`, rewrite);
    const generatedSection: SuperPage["sections"][number] = { ...section, paragraphs: rewrite.output.paragraphs, examples: rewrite.output.examples, caveats: rewrite.output.caveats, qualityNotes: rewrite.output.qualityNotes };
    generatedSections.push(generatedSection);
    const generatedText = generatedSection.paragraphs.join("\n\n");
    const factPrompt = promptForSection("fact-review", article, generatedSection);
    const factReview = await generateWithModel<ReviewOutput>({ task: "fact-review", input: generatedText, prompt: factPrompt, context: { section: generatedSection }, mode: "mock" });
    const tonePrompt = promptForSection("tone-review", article, generatedSection);
    const toneReview = await generateWithModel<ReviewOutput>({ task: "tone-review", input: generatedText, prompt: tonePrompt, context: { section: generatedSection }, mode: "mock" });
    const statPrompt = promptForSection("unsupported-stat-review", article, generatedSection);
    const statReview = await generateWithModel<ReviewOutput>({ task: "unsupported-stat-review", input: generatedText, prompt: statPrompt, context: { section: generatedSection }, mode: "mock" });
    const citationPrompt = promptForSection("fake-citation-review", article, generatedSection);
    const citationReview = await generateWithModel<ReviewOutput>({ task: "fake-citation-review", input: generatedText, prompt: citationPrompt, context: { section: generatedSection }, mode: "mock" });
    for (const [label, response] of Object.entries({ factReview, toneReview, statReview, citationReview })) assertValidResponse(`${label}:${section.id}`, response);
    const computedIssues = reviewSectionQuality(generatedSection);
    sectionLogs.push({
      sectionId: section.id,
      promptIds: [rewritePrompt.id, factPrompt.id, tonePrompt.id, statPrompt.id, citationPrompt.id],
      rewrite,
      generatedSection: { paragraphs: generatedSection.paragraphs, examples: generatedSection.examples, caveats: generatedSection.caveats, qualityNotes: generatedSection.qualityNotes },
      reviews: { factReview, toneReview, statReview, citationReview, computedIssues },
      qualityStatus: qualityStatusFromIssues(computedIssues),
    });
  }
  article.sections = generatedSections;
  events.push(event("blocks", `Generated and reviewed ${generatedSections.length} persisted section blocks.`));

  const imageMetadata = [];
  for (const slot of article.imageSlots) imageMetadata.push(await generateMockImage({ articleSlug: article.slug, prompt: imagePromptRecord(slot) }));
  events.push(event("images", `Prepared ${imageMetadata.length} persisted image prompt records.`));

  const computedContentIssues = reviewPageContentQuality(article);
  const seo = validateSeoReadiness([article]);
  const qualityReport = {
    articleSlug: article.slug,
    generatedAt: isoNow(),
    mode: "mock",
    outline,
    gates: article.qualityGates,
    computedContentStatus: qualityStatusFromIssues(computedContentIssues),
    computedContentIssues,
    seo,
    sectionLogs,
    imageCount: imageMetadata.length,
  };
  assertSuperPage(article);
  return { article, outline, sectionLogs, imageMetadata, qualityReport, events };
}

export async function generateWorkflowProject(workflowInput: string | WorkflowProjectInput, template: SuperPage): Promise<WorkflowProjectResult> {
  const { article, outline, sectionLogs, imageMetadata, qualityReport, events } = await buildGeneratedProject(template, workflowInput);
  const directory = article.slug;
  const root = join(process.cwd(), "content", "articles", directory);
  const generatedDir = join(root, "generated");
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(join(root, "article.json"), `${JSON.stringify(article, null, 2)}\n`);
  writeFileSync(join(generatedDir, "generated-article.json"), `${JSON.stringify(article, null, 2)}\n`);
  writeFileSync(join(generatedDir, "generation-log.json"), `${JSON.stringify({ outline, sections: sectionLogs }, null, 2)}\n`);
  writeFileSync(join(generatedDir, "image-metadata.json"), `${JSON.stringify(imageMetadata, null, 2)}\n`);
  writeFileSync(join(generatedDir, "quality-report.json"), `${JSON.stringify(qualityReport, null, 2)}\n`);
  const seo = validateSeoReadiness([article]);
  const contentIssues = reviewPageContentQuality(article);
  const imageWarnings = article.imageSlots.filter((slot) => slot.qa.relevance !== "pass" || slot.qa.textArtifacts !== "pass" || slot.qa.realism !== "pass").length;
  return {
    slug: article.slug,
    directory,
    previewPath: `/workflow/preview/${article.slug}`,
    articlePath: `/articles/${article.slug}`,
    generatedAt: isoNow(),
    article,
    events: [event("system", `Persisted project at content/articles/${directory}.`), ...events],
    quality: {
      valid: seo.valid && contentIssues.length === 0 && article.qualityGates.every((gate) => gate.status !== "fail"),
      failingGates: article.qualityGates.filter((gate) => gate.status === "fail").length,
      warnings: seo.warnings.length + imageWarnings,
      seoErrors: seo.errors,
      contentIssues: contentIssues.length,
    },
  };
}
