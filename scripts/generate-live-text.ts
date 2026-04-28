import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateWithModel, promptForPage, promptForSection, routeForTask } from "../src/models/gateway";
import type { OutlineOutput, SectionRewriteOutput } from "../src/models/validation";
import { getDefaultArticle } from "../src/super-page/data";

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const article = getDefaultArticle();
  const sectionId = argValue("--section") ?? article.sections[0]?.id;
  const section = article.sections.find((item) => item.id === sectionId);
  if (!section) throw new Error(`Unknown section: ${sectionId}`);

  const outputDir = join(process.cwd(), "content", "articles", "demo-super-page", "generated");
  mkdirSync(outputDir, { recursive: true });

  const outlinePrompt = promptForPage("outline", article);
  const outline = await generateWithModel<OutlineOutput>({ task: "outline", input: outlinePrompt.user, prompt: outlinePrompt, context: { page: article }, mode: "live" });
  const rewritePrompt = promptForSection("section-rewrite", article, section);
  const rewrite = await generateWithModel<SectionRewriteOutput>({ task: "section-rewrite", input: rewritePrompt.user, prompt: rewritePrompt, context: { section }, mode: "live" });

  const route = routeForTask("section-rewrite");
  const result = {
    route: {
      provider: route.provider,
      model: route.model,
      baseUrl: route.baseUrl,
      apiKeyPresent: route.apiKeyPresent,
      endpoint: route.endpoint,
    },
    outline: {
      provider: outline.provider,
      model: outline.model,
      validation: outline.validation,
      warnings: outline.warnings,
      output: outline.output,
    },
    rewrite: {
      sectionId: section.id,
      provider: rewrite.provider,
      model: rewrite.model,
      validation: rewrite.validation,
      warnings: rewrite.warnings,
      output: rewrite.output,
    },
  };
  const outputPath = join(outputDir, "text-live-result.json");
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Wrote live text generation result: ${outputPath}`);
  if (!outline.validation.valid || !rewrite.validation.valid) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
