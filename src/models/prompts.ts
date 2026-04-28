import type { SuperPage } from "@/super-page/types";
import type { ModelTask } from "./gateway";

export interface PromptTemplateInput {
  page: SuperPage;
  section?: SuperPage["sections"][number];
}

export interface PromptTemplate {
  id: string;
  task: ModelTask;
  system: string;
  user: string;
  expectedJsonShape: string;
}

function constraints(section: SuperPage["sections"][number]) {
  return [
    `Must include: ${section.generationConstraints.mustInclude.join(", ")}`,
    `Avoid phrases: ${section.generationConstraints.avoidPhrases.join(", ")}`,
    `Claim policy: ${section.generationConstraints.claimPolicy}`,
    `Citation policy: ${section.generationConstraints.citationPolicy}`,
  ].join("\n");
}

export function buildPrompt(task: ModelTask, input: PromptTemplateInput): PromptTemplate {
  const { page, section } = input;

  if (task === "outline") {
    return {
      id: "outline-v1",
      task,
      system: "You are an SEO information architect. Return only valid JSON.",
      user: `Create a Super Page outline for keyword ${page.brief.keyword}. Audience: ${page.brief.audience}. Angle: ${page.brief.angle}.`,
      expectedJsonShape: '{ "sections": [{ "id": string, "heading": string, "searchIntent": string }] }',
    };
  }

  if (!section) {
    throw new Error(`${task} prompt requires a section`);
  }

  const sourceNotes = section.sourceNotes.map((note) => `- ${note.label} (${note.sourceType}): ${note.note}`).join("\n");

  if (task === "section-rewrite") {
    return {
      id: "section-rewrite-v1",
      task,
      system: "You rewrite SEO article sections with concrete examples, caveats, and source discipline. Return only valid JSON.",
      user: [
        `Keyword: ${page.brief.keyword}`,
        `Section: ${section.heading}`,
        `Search intent: ${section.searchIntent}`,
        `Summary claim: ${section.summaryClaim}`,
        `Source notes:\n${sourceNotes}`,
        constraints(section),
        `Current examples: ${section.examples.join(" | ")}`,
        `Current caveats: ${section.caveats.join(" | ")}`,
        "Return two rewritten paragraphs, examples, caveats, and a concise quality note.",
      ].join("\n\n"),
      expectedJsonShape: '{ "paragraphs": string[], "examples": string[], "caveats": string[], "qualityNotes": string[] }',
    };
  }

  if (task === "fact-review") {
    return {
      id: "fact-review-v1",
      task,
      system: "You identify unsupported claims, fake statistics, and fake citations. Return only valid JSON.",
      user: [
        `Section: ${section.heading}`,
        `Source notes:\n${sourceNotes}`,
        `Paragraphs:\n${section.paragraphs.join("\n\n")}`,
        "Flag statistics, percentages, dates, quotes, studies, or citations not grounded in the source notes.",
      ].join("\n\n"),
      expectedJsonShape: '{ "status": "pass"|"warn"|"fail", "issues": string[] }',
    };
  }

  if (task === "tone-review") {
    return {
      id: "tone-review-v1",
      task,
      system: "You detect generic AI writing patterns and repeated intros. Return only valid JSON.",
      user: [
        `Avoid phrases: ${section.generationConstraints.avoidPhrases.join(", ")}`,
        `Paragraphs:\n${section.paragraphs.join("\n\n")}`,
        "Flag mechanical openings, repeated cadence, and filler phrases.",
      ].join("\n\n"),
      expectedJsonShape: '{ "status": "pass"|"warn"|"fail", "issues": string[] }',
    };
  }

  if (task === "unsupported-stat-review") {
    return {
      id: "unsupported-stat-review-v1",
      task,
      system: "You reject unsupported statistics. Return only valid JSON.",
      user: `Review for unsupported numbers in section ${section.heading}:\n${section.paragraphs.join("\n\n")}`,
      expectedJsonShape: '{ "status": "pass"|"fail", "issues": string[] }',
    };
  }

  if (task === "fake-citation-review") {
    return {
      id: "fake-citation-review-v1",
      task,
      system: "You reject fabricated citations, fake papers, and unverifiable source names. Return only valid JSON.",
      user: `Review for fake citations in section ${section.heading}:\n${section.paragraphs.join("\n\n")}`,
      expectedJsonShape: '{ "status": "pass"|"fail", "issues": string[] }',
    };
  }

  if (task === "image-prompt") {
    return {
      id: "image-prompt-v1",
      task,
      system: "You write realistic article image prompts. Return only valid JSON.",
      user: `Create image prompt metadata for ${section.heading}. Avoid fake UI text and generic stock-photo composition.`,
      expectedJsonShape: '{ "subject": string, "context": string, "composition": string, "avoid": string[] }',
    };
  }

  return {
    id: "image-generation-v1",
    task,
    system: "Generate image request metadata.",
    user: `Prepare image request for ${section.heading}.`,
    expectedJsonShape: '{ "prompt": string }',
  };
}
