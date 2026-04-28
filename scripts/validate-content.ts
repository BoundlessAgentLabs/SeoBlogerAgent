import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { reviewTextQuality } from "../src/quality/content";
import { validateSuperPage, assertSuperPage } from "../src/super-page/validation";
import { validateSeoReadiness } from "../src/seo/validation";
import { validateImageReadiness } from "../src/images/validation";
import type { SuperPage } from "../src/super-page/types";

interface QualityCase {
  id: string;
  expected: "pass" | "fail";
  text: string;
}

interface CaseResult {
  slug: string;
  expected: "pass" | "fail";
  passed: boolean;
  errors: string[];
}

interface GeneratedQualityReport {
  computedContentStatus?: "pass" | "warn" | "fail";
  computedContentIssues?: Array<{ severity?: string; status?: string; evidence?: string }>;
  sectionLogs?: Array<{ reviews?: Record<string, { output?: { status?: string; issues?: string[] }; validation?: { valid?: boolean; errors?: string[] } }> }>;
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

function validateImageNegativeCases(validPages: SuperPage[]): number {
  if (validPages.length === 0) return 1;
  const cases: Array<{ id: string; mutate: (page: SuperPage) => void; expectedText: string }> = [
    { id: "qa-relevance-fail", expectedText: "relevance failed", mutate: (page) => { page.imageSlots[0].qa.relevance = "fail"; } },
    { id: "qa-text-artifacts-fail", expectedText: "textArtifacts failed", mutate: (page) => { page.imageSlots[0].qa.textArtifacts = "fail"; } },
    { id: "qa-realism-fail", expectedText: "realism failed", mutate: (page) => { page.imageSlots[0].qa.realism = "fail"; } },
    { id: "stock-composition", expectedText: "stock-photo", mutate: (page) => { page.imageSlots[0].prompt.composition = "generic business people smiling in a corporate stock photo handshake"; } },
  ];
  let failures = 0;
  for (const item of cases) {
    const page = clonePage(validPages[0]);
    item.mutate(page);
    const result = validateImageReadiness(page);
    const passed = result.errors.some((error) => error.includes(item.expectedText));
    console.log(`${passed ? "PASS" : "FAIL"} image:${item.id} expected=fail`);
    for (const error of result.errors) console.log(`  - ${error}`);
    if (!passed) failures += 1;
  }
  return failures;
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
    for (const issue of issues) console.log(`  - ${issue.id}: ${issue.evidence}`);
    if (!passed) failures += 1;
  }
  return failures;
}

function generatedReportHasBlockingIssue(report: GeneratedQualityReport): string[] {
  const errors: string[] = [];
  if (report.computedContentStatus === "fail") errors.push("generated report computedContentStatus is fail");
  for (const [index, issue] of (report.computedContentIssues ?? []).entries()) {
    if (issue.status === "fail" || issue.severity === "high") errors.push(`generated report issue ${index}: ${issue.evidence ?? "high severity issue"}`);
  }
  for (const [sectionIndex, section] of (report.sectionLogs ?? []).entries()) {
    for (const [reviewName, review] of Object.entries(section.reviews ?? {})) {
      if (review.validation?.valid === false) errors.push(`section ${sectionIndex} ${reviewName} output validation failed: ${(review.validation.errors ?? []).join("; ")}`);
      if (review.output?.status === "fail") errors.push(`section ${sectionIndex} ${reviewName} failed: ${(review.output.issues ?? []).join("; ")}`);
    }
  }
  return errors;
}

function validateGeneratedReports(): number {
  const reportPath = join(process.cwd(), "content", "articles", "demo-super-page", "generated", "quality-report.json");
  if (!existsSync(reportPath)) {
    console.log("FAIL generated-report:missing expected=pass");
    return 1;
  }
  const report = JSON.parse(readFileSync(reportPath, "utf8")) as GeneratedQualityReport;
  const errors = generatedReportHasBlockingIssue(report);
  console.log(`${errors.length === 0 ? "PASS" : "FAIL"} generated-report:current expected=pass`);
  for (const error of errors) console.log(`  - ${error}`);

  const negative: GeneratedQualityReport = {
    computedContentStatus: "fail",
    computedContentIssues: [{ status: "fail", severity: "high", evidence: "In today's digital age generated intro" }],
    sectionLogs: [{ reviews: { toneReview: { output: { status: "fail", issues: ["generic intro"] }, validation: { valid: true, errors: [] } } } }],
  };
  const negativeErrors = generatedReportHasBlockingIssue(negative);
  const negativePassed = negativeErrors.length > 0;
  console.log(`${negativePassed ? "PASS" : "FAIL"} generated-report:quality-negative expected=fail`);
  for (const error of negativeErrors) console.log(`  - ${error}`);
  return (errors.length === 0 ? 0 : 1) + (negativePassed ? 0 : 1);
}

const root = join(process.cwd(), "content", "articles");
const slugs = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

function expectedForSlug(slug: string): "pass" | "fail" {
  return slug.startsWith("negative-") ? "fail" : "pass";
}

function readJson(slug: string): unknown {
  return JSON.parse(readFileSync(join(root, slug, "article.json"), "utf8"));
}

const validPages: SuperPage[] = [];
const results: CaseResult[] = slugs.map((slug) => {
  const value = readJson(slug);
  const result = validateSuperPage(value);
  const expected = expectedForSlug(slug);
  const passed = expected === "pass" ? result.valid : !result.valid;
  if (expected === "pass" && result.valid) validPages.push(assertSuperPage(value));
  return { slug, expected, passed, errors: result.errors };
});

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} ${result.slug} expected=${result.expected}`);
  for (const error of result.errors.slice(0, 8)) console.log(`  - ${error}`);
}

const seo = validateSeoReadiness(validPages);
for (const warning of seo.warnings) console.log(`WARN ${warning}`);
for (const error of seo.errors) console.log(`SEO-FAIL ${error}`);

const qualityFailures = validateQualityCases();
const seoNegativeFailures = validateSeoNegativeCases(validPages);
const imageNegativeFailures = validateImageNegativeCases(validPages);
const generatedReportFailures = validateGeneratedReports();
const failed = results.filter((result) => !result.passed);
if (failed.length > 0 || !seo.valid || qualityFailures > 0 || seoNegativeFailures > 0 || imageNegativeFailures > 0 || generatedReportFailures > 0) {
  console.error(`Content validation failed for ${failed.length} schema case(s), ${seo.errors.length} SEO case(s), ${qualityFailures} quality case(s), ${seoNegativeFailures} SEO negative case(s), ${imageNegativeFailures} image negative case(s), and ${generatedReportFailures} generated-report case(s).`);
  process.exit(1);
}

console.log(`Content validation passed for ${results.length} schema case(s), including quality, image, generated-report, and SEO negative checks.`);
