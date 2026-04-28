import type { SuperPage } from "@/super-page/types";
import { validateImageReadiness } from "@/images/validation";

export interface SeoValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSeoReadiness(pages: SuperPage[]): SeoValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const canonicalCounts = new Map<string, number>();

  for (const page of pages) {
    canonicalCounts.set(page.metadata.canonicalUrl, (canonicalCounts.get(page.metadata.canonicalUrl) ?? 0) + 1);

    if (!page.metadata.title || page.metadata.title.length > 70) {
      errors.push(`/${page.slug}/metadata/title must exist and stay under 70 characters`);
    }
    if (!page.metadata.description || page.metadata.description.length > 170) {
      errors.push(`/${page.slug}/metadata/description must exist and stay under 170 characters`);
    }
    if (page.breadcrumbs.length < 2) {
      errors.push(`/${page.slug}/breadcrumbs must include at least home and current page`);
    }
    const imageReadiness = validateImageReadiness(page);
    errors.push(...imageReadiness.errors);
    warnings.push(...imageReadiness.warnings);
    for (const gate of page.qualityGates) {
      if (gate.status === "fail") {
        errors.push(`/${page.slug}/qualityGates/${gate.id} is failing: ${gate.evidence}`);
      }
    }
  }

  for (const [canonicalUrl, count] of canonicalCounts.entries()) {
    if (count > 1) {
      errors.push(`duplicate canonical URL detected: ${canonicalUrl}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
