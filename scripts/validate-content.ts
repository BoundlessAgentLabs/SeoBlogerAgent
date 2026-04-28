import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { reviewTextQuality } from "../src/quality/content";
import { validateSuperPage, assertSuperPage } from "../src/super-page/validation";
import { validateSeoReadiness } from "../src/seo/validation";
import type { SuperPage } from "../src/super-page/types";


interface QualityCase {
  id: string;
  expected: "pass" | "fail";
  text: string;
}


function clonePage(page: SuperPage): SuperPage {
  return JSON.parse(JSON.stringify(page)) as SuperPage;
}

function validateSeoNegativeCases(validPages: SuperPage[]): number {
  if (validPages.length === 0) return 1;
  const base = validPages[0];
  const duplicate = clonePage(base);
  duplicate.slug = `${base.slug}-duplicate`;
  const duplicateResult = validateSeoReadiness([base, duplicate]);
  const duplicatePassed = duplicateResult.errors.some((error) => error.includes("duplicate canonical URL"));
  console.log(`${duplicatePassed ? "PASS" : "FAIL"} seo:duplicate-canonical expected=fail`);
  for (const error of duplicateResult.errors) console.log(`  - ${error}`);

  const missingAlt = clonePage(base);
  missingAlt.imageSlots[0].alt = "bad";
  const missingAltResult = validateSeoReadiness([missingAlt]);
  const missingAltPassed = missingAltResult.errors.some((error) => error.includes("alt"));
  console.log(`${missingAltPassed ? "PASS" : "FAIL"} seo:missing-alt expected=fail`);
  for (const error of missingAltResult.errors) console.log(`  - ${error}`);

  return (duplicatePassed ? 0 : 1) + (missingAltPassed ? 0 : 1);
}

function validateQualityCases(): number {
  const casesPath = join(process.cwd(), "content", "quality-cases", "cases.json");
  const cases = JSON.parse(readFileSync(casesPath, "utf8")) as QualityCase[];
  let failures = 0;
  for (const item of cases) {
    const issues = reviewTextQuality(item.text, `/quality-cases/${item.id}`);
    const actual = issues.length > 0 ? "fail" : "pass";
    const passed = actual === item.expected;
    console.log(`${passed ? "PASS" : "FAIL"} quality:${item.id} expected=${item.expected} actual=${actual}`);
    for (const issue of issues) {
      console.log(`  - ${issue.id}: ${issue.evidence}`);
    }
    if (!passed) failures += 1;
  }
  return failures;
}

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

const qualityFailures = validateQualityCases();
const seoNegativeFailures = validateSeoNegativeCases(validPages);
const failed = results.filter((result) => !result.passed);
if (failed.length > 0 || !seo.valid || qualityFailures > 0 || seoNegativeFailures > 0) {
  console.error(`Content validation failed for ${failed.length} schema case(s), ${seo.errors.length} SEO case(s), ${qualityFailures} quality case(s), and ${seoNegativeFailures} SEO negative case(s).`);
  process.exit(1);
}

console.log(`Content validation passed for ${results.length} case(s), including negative validation fixtures and SEO readiness checks.`);
