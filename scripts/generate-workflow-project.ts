import { getDefaultArticle } from "../src/super-page/data";
import { generateWorkflowProject } from "../src/workflow/generateProject";

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const topic = argValue("--topic") ?? "open source SEO content workflow";
  const result = await generateWorkflowProject(topic, getDefaultArticle());
  console.log(`Persisted workflow project: ${result.slug}`);
  console.log(`- ${result.previewPath}`);
  console.log(`- ${result.articlePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
