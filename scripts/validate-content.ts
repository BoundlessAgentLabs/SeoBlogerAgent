import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SuperPageView } from "../src/components/SuperPageView";
import { generateWithModel } from "../src/models/gateway";
import { reviewTextQuality } from "../src/quality/content";
import { validateSuperPage, assertSuperPage } from "../src/super-page/validation";
import { articleJsonLd, breadcrumbJsonLd, serializeJsonLd } from "../src/seo/jsonLd";
import { validateSeoReadiness } from "../src/seo/validation";
import { validateImageReadiness } from "../src/images/validation";
import { getDefaultArticle } from "../src/super-page/data";
import { buildGeneratedProject } from "../src/workflow/generateProject";
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

function validateJsonLdCases(validPages: SuperPage[]): number {
  if (validPages.length === 0) return 1;
  const page = clonePage(validPages[0]);
  page.metadata.title = `Safe title </script><script>alert("xss")</script>`;
  const serialized = serializeJsonLd(articleJsonLd(page));
  const escapedScriptPassed = !serialized.toLowerCase().includes("</script") && serialized.includes("\\u003c/script");
  console.log(`${escapedScriptPassed ? "PASS" : "FAIL"} jsonld:escaped-script-close expected=pass`);
  if (!escapedScriptPassed) console.log("  - JSON-LD serialization contains a raw script close sequence");

  const jsonLd = articleJsonLd(validPages[0]);
  const images = Array.isArray(jsonLd.image) ? jsonLd.image : [];
  const absoluteImagesPassed = images.length > 0 && images.every((image) => /^https?:\/\//.test(image));
  console.log(`${absoluteImagesPassed ? "PASS" : "FAIL"} jsonld:absolute-image-urls expected=pass`);
  for (const image of images) console.log(`  - ${image}`);

  const breadcrumb = breadcrumbJsonLd(validPages[0]);
  const breadcrumbItems = breadcrumb.itemListElement.map((item) => item.item);
  const absoluteBreadcrumbsPassed = breadcrumbItems.length > 0 && breadcrumbItems.every((item) => /^https?:\/\//.test(item));
  console.log(`${absoluteBreadcrumbsPassed ? "PASS" : "FAIL"} jsonld:absolute-breadcrumb-urls expected=pass`);
  for (const item of breadcrumbItems) console.log(`  - ${item}`);

  return (escapedScriptPassed ? 0 : 1) + (absoluteImagesPassed ? 0 : 1) + (absoluteBreadcrumbsPassed ? 0 : 1);
}

function validateRenderCases(validPages: SuperPage[]): number {
  if (validPages.length === 0) return 1;
  const page = clonePage(validPages[0]);
  const sectionImageAlt = page.imageSlots[1]?.alt;
  for (const slot of page.imageSlots) delete slot.assetPath;
  const html = renderToStaticMarkup(createElement(SuperPageView, { page }));
  const noUndefinedSrc = !html.includes('src="undefined"') && !html.includes('src=""');
  const sectionImageSkipped = sectionImageAlt ? !html.includes(`alt="${sectionImageAlt}"`) : true;
  const passed = noUndefinedSrc && sectionImageSkipped;
  console.log(`${passed ? "PASS" : "FAIL"} render:missing-section-image-asset expected=pass`);
  if (!noUndefinedSrc) console.log("  - rendered HTML contains an empty or undefined image src");
  if (!sectionImageSkipped) console.log("  - rendered a section image even though its assetPath was absent");
  return passed ? 0 : 1;
}

async function validateProviderDiagnosticCases(): Promise<number> {
  const originalFetch = globalThis.fetch;
  const cases = [
    {
      id: "chat-html-error",
      env: { AI_PROVIDER: "openai-compatible", AI_BASE_URL: "https://provider.test/v1", AI_API_KEY: "test-key" },
      response: () => new Response("<html>bad gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } }),
      expectedWarning: "provider response body was not JSON",
    },
    {
      id: "gemini-empty-error",
      env: { AI_PROVIDER: "gemini", GEMINI_BASE_URL: "https://gemini.test/v1beta", GEMINI_API_KEY: "test-key" },
      response: () => new Response("", { status: 502 }),
      expectedWarning: "provider response body was empty",
    },
  ];
  let failures = 0;
  try {
    for (const item of cases) {
      globalThis.fetch = (async () => item.response()) as typeof fetch;
      const result = await generateWithModel({ task: "tone-review", input: "Review this generated section.", mode: "live" }, item.env as unknown as NodeJS.ProcessEnv);
      const passed = !result.validation.valid && result.warnings.includes(item.expectedWarning) && result.warnings.includes("HTTP 502");
      console.log(`${passed ? "PASS" : "FAIL"} provider-diagnostics:${item.id} expected=pass`);
      for (const warning of result.warnings) console.log(`  - ${warning}`);
      if (!passed) failures += 1;
    }
  } finally {
    globalThis.fetch = originalFetch;
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
  const generatedDir = join(process.cwd(), "content", "articles", "demo-super-page", "generated");
  const reportPath = join(generatedDir, "quality-report.json");
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

  const liveAttemptsPath = join(generatedDir, "image-live-attempts.json");
  const liveAttempts = existsSync(liveAttemptsPath) ? JSON.parse(readFileSync(liveAttemptsPath, "utf8")) as Array<{ mode?: string; blocker?: string }> : [];
  const mockNoLivePassed = liveAttempts.length > 0 && liveAttempts.every((attempt) => attempt.mode !== "live" && attempt.blocker?.includes("generate:mock does not call live image providers"));
  console.log(`${mockNoLivePassed ? "PASS" : "FAIL"} generated-report:mock-no-live-image-calls expected=pass`);
  if (!mockNoLivePassed) console.log("  - image-live-attempts.json should contain deterministic blocked mock records, not live image attempts");
  return (errors.length === 0 ? 0 : 1) + (negativePassed ? 0 : 1) + (mockNoLivePassed ? 0 : 1);
}

async function validateWorkflowTopicCases(): Promise<number> {
  const cases = [
    { id: "long-tail", topic: "best AI SEO content workflow for multilingual ecommerce category pages with realistic product images and strict quality gates" },
    { id: "zh-keyword", topic: "北京开芯院 SEO 内容工作流" },
    { id: "ja-keyword", topic: "東京のSEO記事生成ワークフロー" },
  ];
  const slugs = new Set<string>();
  let failures = 0;
  for (const item of cases) {
    const errors: string[] = [];
    try {
      const { article } = await buildGeneratedProject(getDefaultArticle(), item.topic);
      const schema = validateSuperPage(article);
      if (!schema.valid) errors.push(...schema.errors);
      if (article.metadata.title.length > 70) errors.push(`metadata.title length ${article.metadata.title.length} exceeds 70`);
      if (article.metadata.description.length > 170) errors.push(`metadata.description length ${article.metadata.description.length} exceeds 170`);
      if (article.slug.endsWith("untitled-topic")) errors.push("slug collapsed to untitled-topic");
      if (slugs.has(article.slug)) errors.push(`duplicate generated slug ${article.slug}`);
      slugs.add(article.slug);
      console.log(`${errors.length === 0 ? "PASS" : "FAIL"} workflow-topic:${item.id} expected=pass slug=${article.slug} titleLength=${article.metadata.title.length} descriptionLength=${article.metadata.description.length}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      console.log(`FAIL workflow-topic:${item.id} expected=pass`);
    }
    for (const error of errors) console.log(`  - ${error}`);
    if (errors.length > 0) failures += 1;
  }
  return failures;
}

async function main() {
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
  const jsonLdFailures = validateJsonLdCases(validPages);
  const renderFailures = validateRenderCases(validPages);
  const providerDiagnosticFailures = await validateProviderDiagnosticCases();
  const generatedReportFailures = validateGeneratedReports();
  const workflowTopicFailures = await validateWorkflowTopicCases();
  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0 || !seo.valid || qualityFailures > 0 || seoNegativeFailures > 0 || imageNegativeFailures > 0 || jsonLdFailures > 0 || renderFailures > 0 || providerDiagnosticFailures > 0 || generatedReportFailures > 0 || workflowTopicFailures > 0) {
    console.error(`Content validation failed for ${failed.length} schema case(s), ${seo.errors.length} SEO case(s), ${qualityFailures} quality case(s), ${seoNegativeFailures} SEO negative case(s), ${imageNegativeFailures} image negative case(s), ${jsonLdFailures} JSON-LD case(s), ${renderFailures} render case(s), ${providerDiagnosticFailures} provider diagnostic case(s), ${generatedReportFailures} generated-report case(s), and ${workflowTopicFailures} workflow-topic case(s).`);
    process.exit(1);
  }

  console.log(`Content validation passed for ${results.length} schema case(s), including quality, image, JSON-LD, render, provider diagnostic, generated-report, workflow-topic, and SEO negative checks.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
