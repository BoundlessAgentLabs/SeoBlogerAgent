import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateTextMock } from "../src/models/gateway";
import { imagePromptRecord } from "../src/images/prompt";
import { generateMockImage } from "../src/images/adapter";
import { getDefaultArticle } from "../src/super-page/data";
import { validateSeoReadiness } from "../src/seo/validation";

async function main() {
  const article = getDefaultArticle();
  const outputDir = join(process.cwd(), "content", "articles", "demo-super-page", "generated");
  mkdirSync(outputDir, { recursive: true });

  const sectionLogs = [];
  for (const section of article.sections.slice(0, 2)) {
    const response = await generateTextMock({
      task: "section-rewrite",
      input: `${section.heading}\n${section.summaryClaim}`,
      context: { sectionId: section.id, keyword: article.brief.keyword },
    });
    sectionLogs.push({ sectionId: section.id, ...response });
  }

  const imageMetadata = [];
  for (const slot of article.imageSlots) {
    const record = imagePromptRecord(slot);
    imageMetadata.push(await generateMockImage({ articleSlug: article.slug, prompt: record }));
  }

  const qualityReport = {
    articleSlug: article.slug,
    generatedAt: new Date("2026-04-28T00:00:00.000Z").toISOString(),
    mode: "mock",
    gates: article.qualityGates,
    seo: validateSeoReadiness([article]),
    sectionLogs,
    imageCount: imageMetadata.length,
  };

  writeFileSync(join(outputDir, "generation-log.json"), `${JSON.stringify(sectionLogs, null, 2)}\n`);
  writeFileSync(join(outputDir, "image-metadata.json"), `${JSON.stringify(imageMetadata, null, 2)}\n`);
  writeFileSync(join(outputDir, "quality-report.json"), `${JSON.stringify(qualityReport, null, 2)}\n`);

  console.log(`Generated mock artifacts for ${article.slug}`);
  console.log(`- ${join(outputDir, "generation-log.json")}`);
  console.log(`- ${join(outputDir, "image-metadata.json")}`);
  console.log(`- ${join(outputDir, "quality-report.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
