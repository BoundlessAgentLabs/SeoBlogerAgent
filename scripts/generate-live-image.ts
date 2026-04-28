import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateLiveImageAttempt } from "../src/images/adapter";
import { imagePromptRecord } from "../src/images/prompt";
import { getDefaultArticle } from "../src/super-page/data";

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const article = getDefaultArticle();
  const slotId = argValue("--slot") ?? article.imageSlots[0]?.id;
  const slot = article.imageSlots.find((item) => item.id === slotId);
  if (!slot) throw new Error(`Unknown image slot: ${slotId}`);

  const outputDir = join(process.cwd(), "content", "articles", "demo-super-page", "generated");
  mkdirSync(outputDir, { recursive: true });
  const result = await generateLiveImageAttempt({ articleSlug: article.slug, prompt: imagePromptRecord(slot), mode: "live" });
  const recordPath = join(outputDir, "image-live-result.json");
  writeFileSync(recordPath, `${JSON.stringify(result, null, 2)}\n`);

  if (result.mode === "live" && result.assetPath) {
    const articlePath = join(outputDir, "generated-article.json");
    const generatedArticle = JSON.parse(readFileSync(articlePath, "utf8"));
    const targetSlot = generatedArticle.imageSlots.find((item: { id: string }) => item.id === result.imageSlotId);
    if (targetSlot) {
      targetSlot.assetPath = result.assetPath;
      targetSlot.status = "generated";
      targetSlot.provider = result.provider;
      writeFileSync(articlePath, `${JSON.stringify(generatedArticle, null, 2)}\n`);
    }
    console.log(`Saved live image for ${result.imageSlotId}: ${result.assetPath}`);
  } else {
    console.log(`Live image generation blocked for ${result.imageSlotId}: ${result.blocker ?? "unknown blocker"}`);
  }
  console.log(`- ${recordPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
