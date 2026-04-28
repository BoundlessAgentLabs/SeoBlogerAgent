import type { SuperPage } from "@/super-page/types";

export type QualitySeverity = "low" | "medium" | "high";
export type QualityStatus = "pass" | "warn" | "fail";

export interface QualityIssue {
  id: string;
  status: QualityStatus;
  severity: QualitySeverity;
  evidence: string;
  path?: string;
}

const genericIntroPatterns = [
  /in today'?s (digital )?(age|world|landscape)/i,
  /unlock(ing)? the power/i,
  /delve into/i,
  /game[- ]changer/i,
  /it is important to note/i,
];

const unsupportedStatPattern = /\b\d+(?:\.\d+)?\s?(?:%|percent\b|x\b|times\b|million\b|billion\b|days?\b)/i;
const fakeCitationPatterns = [
  /according to (a|an|the) (recent )?(study|research|report)(?!\s+(from|by)\s+(google|search central|documentation))/i,
  /journal of ai seo/i,
  /smith et al\.?,?\s*20\d{2}/i,
  /\[(?:source|citation needed|ref)\]/i,
];

export function reviewTextQuality(text: string, path = "/text"): QualityIssue[] {
  const issues: QualityIssue[] = [];
  for (const pattern of genericIntroPatterns) {
    if (pattern.test(text)) {
      issues.push({ id: "generic-ai-intro", status: "fail", severity: "high", evidence: `Generic AI phrase matched: ${pattern}`, path });
      break;
    }
  }
  if (unsupportedStatPattern.test(text) && !/(according to google|google search central|documented source|source:\s*https?:)/i.test(text)) {
    issues.push({ id: "unsupported-statistic", status: "fail", severity: "high", evidence: "Numeric/statistical claim appears without source grounding.", path });
  }
  for (const pattern of fakeCitationPatterns) {
    if (pattern.test(text)) {
      issues.push({ id: "fake-citation", status: "fail", severity: "high", evidence: `Potential fabricated citation matched: ${pattern}`, path });
      break;
    }
  }
  return issues;
}

export function reviewSectionQuality(section: SuperPage["sections"][number]): QualityIssue[] {
  return section.paragraphs.flatMap((paragraph, index) => reviewTextQuality(paragraph, `/sections/${section.id}/paragraphs/${index}`));
}

export function reviewPageContentQuality(page: SuperPage): QualityIssue[] {
  return page.sections.flatMap(reviewSectionQuality);
}

export function qualityStatusFromIssues(issues: QualityIssue[]): QualityStatus {
  if (issues.some((issue) => issue.status === "fail")) return "fail";
  if (issues.some((issue) => issue.status === "warn")) return "warn";
  return "pass";
}
