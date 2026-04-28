import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateWithModel, promptForSection } from "../src/models/gateway";
import { imagePromptRecord } from "../src/images/prompt";
import { generateLiveImageAttempt, generateMockImage } from "../src/images/adapter";
import { getDefaultArticle } from "../src/super-page/data";
import { validateSeoReadiness } from "../src/seo/validation";
import { reviewPageContentQuality, reviewSectionQuality, qualityStatusFromIssues } from "../src/quality/content";

async function main() {
  const article = getDefaultArticle();
  const outputDir = join(process.cwd(), "content", "articles", "demo-super-page", "generated");
  mkdirSync(outputDir, { recursive: true });

  const sectionLogs = [];
  for (const section of article.sections) {
    const rewritePrompt = promptForSection("section-rewrite", article, section);
    const rewrite = await generateWithModel({
      task: "section-rewrite",
      input: rewritePrompt.user,
      prompt: rewritePrompt,
      context: { section, sectionId: section.id, keyword: article.brief.keyword },
      mode: "mock",
    });

    const factPrompt = promptForSection("fact-review", article, section);
    const factReview = await generateWithModel({ task: "fact-review", input: section.paragraphs.join("\n\n"), prompt: factPrompt, context: { section }, mode: "mock" });
    const tonePrompt = promptForSection("tone-review", article, section);
    const toneReview = await generateWithModel({ task: "tone-review", input: section.paragraphs.join("\n\n"), prompt: tonePrompt, context: { section }, mode: "mock" });
    const statPrompt = promptForSection("unsupported-stat-review", article, section);
    const statReview = await generateWithModel({ task: "unsupported-stat-review", input: section.paragraphs.join("\n\n"), prompt: statPrompt, context: { section }, mode: "mock" });
    const citationPrompt = promptForSection("fake-citation-review", article, section);
    const citationReview = await generateWithModel({ task: "fake-citation-review", input: section.paragraphs.join("\n\n"), prompt: citationPrompt, context: { section }, mode: "mock" });
    const contentIssues = reviewSectionQuality(section);

    sectionLogs.push({
      sectionId: section.id,
      promptIds: [rewritePrompt.id, factPrompt.id, tonePrompt.id, statPrompt.id, citationPrompt.id],
      rewrite,
      reviews: { factReview, toneReview, statReview, citationReview, computedIssues: contentIssues },
      qualityStatus: qualityStatusFromIssues(contentIssues),
    });
  }

  const imageMetadata = [];
  const liveAttempts = [];
  for (const slot of article.imageSlots) {
    const record = imagePromptRecord(slot);
    imageMetadata.push(await generateMockImage({ articleSlug: article.slug, prompt: record }));
    liveAttempts.push(await generateLiveImageAttempt({ articleSlug: article.slug, prompt: record, mode: "live" }));
  }

  const computedContentIssues = reviewPageContentQuality(article);
  const qualityReport = {
    articleSlug: article.slug,
    generatedAt: new Date("2026-04-28T00:00:00.000Z").toISOString(),
    mode: "mock",
    gates: article.qualityGates,
    computedContentStatus: qualityStatusFromIssues(computedContentIssues),
    computedContentIssues,
    seo: validateSeoReadiness([article]),
    sectionLogs,
    imageCount: imageMetadata.length,
    liveImageAttemptsBlocked: liveAttempts.filter((attempt) => attempt.mode === "blocked").length,
  };

  writeFileSync(join(outputDir, "generation-log.json"), `${JSON.stringify(sectionLogs, null, 2)}\n`);
  writeFileSync(join(outputDir, "image-metadata.json"), `${JSON.stringify(imageMetadata, null, 2)}\n`);
  writeFileSync(join(outputDir, "image-live-attempts.json"), `${JSON.stringify(liveAttempts, null, 2)}\n`);
  writeFileSync(join(outputDir, "quality-report.json"), `${JSON.stringify(qualityReport, null, 2)}\n`);

  console.log(`Generated mock artifacts for ${article.slug}`);
  console.log(`- ${join(outputDir, "generation-log.json")}`);
  console.log(`- ${join(outputDir, "image-metadata.json")}`);
  console.log(`- ${join(outputDir, "image-live-attempts.json")}`);
  console.log(`- ${join(outputDir, "quality-report.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
