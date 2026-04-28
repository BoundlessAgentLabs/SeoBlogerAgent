import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateSuperPage, assertSuperPage } from "../src/super-page/validation";
import { validateSeoReadiness } from "../src/seo/validation";
import type { SuperPage } from "../src/super-page/types";

interface CaseResult {
  slug: string;
  expected: "pass" | "fail";
  passed: boolean;
  errors: string[];
}

const root = join(process.cwd(), "content", "articles");
const slugs = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function expectedForSlug(slug: string): "pass" | "fail" {
  return slug.startsWith("negative-") ? "fail" : "pass";
}

function readJson(slug: string): unknown {
  const filePath = join(root, slug, "article.json");
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const validPages: SuperPage[] = [];

const results: CaseResult[] = slugs.map((slug) => {
  const value = readJson(slug);
  const result = validateSuperPage(value);
  const expected = expectedForSlug(slug);
  const passed = expected === "pass" ? result.valid : !result.valid;
  if (expected === "pass" && result.valid) {
    validPages.push(assertSuperPage(value));
  }
  return { slug, expected, passed, errors: result.errors };
});

for (const result of results) {
  const status = result.passed ? "PASS" : "FAIL";
  console.log(`${status} ${result.slug} expected=${result.expected}`);
  if (result.errors.length > 0) {
    for (const error of result.errors.slice(0, 8)) {
      console.log(`  - ${error}`);
    }
  }
}

const seo = validateSeoReadiness(validPages);
for (const warning of seo.warnings) {
  console.log(`WARN ${warning}`);
}
for (const error of seo.errors) {
  console.log(`SEO-FAIL ${error}`);
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0 || !seo.valid) {
  console.error(`Content validation failed for ${failed.length} schema case(s) and ${seo.errors.length} SEO case(s).`);
  process.exit(1);
}

console.log(`Content validation passed for ${results.length} case(s), including negative validation fixtures and SEO readiness checks.`);
