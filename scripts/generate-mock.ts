import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateWithModel, promptForPage, promptForSection } from "../src/models/gateway";
import type { OutlineOutput, ReviewOutput, SectionRewriteOutput } from "../src/models/validation";
import { imagePromptRecord } from "../src/images/prompt";
import { generateLiveImageAttempt, generateMockImage } from "../src/images/adapter";
import { getDefaultArticle } from "../src/super-page/data";
import { validateSeoReadiness } from "../src/seo/validation";
import { reviewPageContentQuality, reviewSectionQuality, qualityStatusFromIssues } from "../src/quality/content";
import type { SuperPage } from "../src/super-page/types";

function assertValidResponse(label: string, response: { validation: { valid: boolean; errors: string[] } }) {
  if (!response.validation.valid) {
    throw new Error(`${label} failed output validation:\n${response.validation.errors.join("\n")}`);
  }
}

async function main() {
  const article = getDefaultArticle();
  const outputDir = join(process.cwd(), "content", "articles", "demo-super-page", "generated");
  mkdirSync(outputDir, { recursive: true });

  const outlinePrompt = promptForPage("outline", article);
  const outline = await generateWithModel<OutlineOutput>({
    task: "outline",
    input: outlinePrompt.user,
    prompt: outlinePrompt,
    context: { page: article, keyword: article.brief.keyword },
    mode: "mock",
  });
  assertValidResponse("outline", outline);

  const generatedSections: SuperPage["sections"] = [];
  const sectionLogs = [];
  for (const section of article.sections) {
    const rewritePrompt = promptForSection("section-rewrite", article, section);
    const rewrite = await generateWithModel<SectionRewriteOutput>({
      task: "section-rewrite",
      input: rewritePrompt.user,
      prompt: rewritePrompt,
      context: { section, sectionId: section.id, keyword: article.brief.keyword },
      mode: "mock",
    });
    assertValidResponse(`rewrite:${section.id}`, rewrite);

    const generatedSection: SuperPage["sections"][number] = {
      ...section,
      paragraphs: rewrite.output.paragraphs,
      examples: rewrite.output.examples,
      caveats: rewrite.output.caveats,
      qualityNotes: rewrite.output.qualityNotes,
    };
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

    const contentIssues = reviewSectionQuality(generatedSection);
    sectionLogs.push({
      sectionId: section.id,
      promptIds: [rewritePrompt.id, factPrompt.id, tonePrompt.id, statPrompt.id, citationPrompt.id],
      rewrite,
      generatedSection: {
        paragraphs: generatedSection.paragraphs,
        examples: generatedSection.examples,
        caveats: generatedSection.caveats,
        qualityNotes: generatedSection.qualityNotes,
      },
      reviews: { factReview, toneReview, statReview, citationReview, computedIssues: contentIssues },
      qualityStatus: qualityStatusFromIssues(contentIssues),
    });
  }

  const generatedPage: SuperPage = { ...article, sections: generatedSections };
  const liveResultPath = join(outputDir, "image-live-result.json");
  if (existsSync(liveResultPath)) {
    const liveResult = JSON.parse(readFileSync(liveResultPath, "utf8")) as { mode?: string; imageSlotId?: string; assetPath?: string; provider?: string };
    if (liveResult.mode === "live" && liveResult.imageSlotId && liveResult.assetPath) {
      const slot = generatedPage.imageSlots.find((item) => item.id === liveResult.imageSlotId);
      if (slot) {
        slot.assetPath = liveResult.assetPath;
        slot.status = "generated";
        slot.provider = liveResult.provider ?? slot.provider;
      }
    }
  }
  const imageMetadata = [];
  const liveAttempts = [];
  for (const slot of generatedPage.imageSlots) {
    const record = imagePromptRecord(slot);
    imageMetadata.push(await generateMockImage({ articleSlug: generatedPage.slug, prompt: record }));
    liveAttempts.push(await generateLiveImageAttempt({ articleSlug: generatedPage.slug, prompt: record, mode: "live" }));
  }

  const computedContentIssues = reviewPageContentQuality(generatedPage);
  const qualityReport = {
    articleSlug: generatedPage.slug,
    generatedAt: new Date("2026-04-28T00:00:00.000Z").toISOString(),
    mode: "mock",
    outline,
    gates: generatedPage.qualityGates,
    computedContentStatus: qualityStatusFromIssues(computedContentIssues),
    computedContentIssues,
    seo: validateSeoReadiness([generatedPage]),
    sectionLogs,
    imageCount: imageMetadata.length,
    liveImageAttemptsBlocked: liveAttempts.filter((attempt) => attempt.mode === "blocked").length,
  };

  writeFileSync(join(outputDir, "generated-article.json"), `${JSON.stringify(generatedPage, null, 2)}\n`);
  writeFileSync(join(outputDir, "generation-log.json"), `${JSON.stringify({ outline, sections: sectionLogs }, null, 2)}\n`);
  writeFileSync(join(outputDir, "image-metadata.json"), `${JSON.stringify(imageMetadata, null, 2)}\n`);
  writeFileSync(join(outputDir, "image-live-attempts.json"), `${JSON.stringify(liveAttempts, null, 2)}\n`);
  writeFileSync(join(outputDir, "quality-report.json"), `${JSON.stringify(qualityReport, null, 2)}\n`);

  console.log(`Generated mock artifacts for ${generatedPage.slug}`);
  console.log(`- ${join(outputDir, "generated-article.json")}`);
  console.log(`- ${join(outputDir, "generation-log.json")}`);
  console.log(`- ${join(outputDir, "image-metadata.json")}`);
  console.log(`- ${join(outputDir, "image-live-attempts.json")}`);
  console.log(`- ${join(outputDir, "quality-report.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
