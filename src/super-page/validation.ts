import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "@content/schemas/super-page.schema.json";
import type { SuperPage } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

function formatError(error: ErrorObject): string {
  const path = error.instancePath || "/";
  return `${path} ${error.message ?? "is invalid"}`;
}

function canonicalPath(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return value.startsWith("/") ? value : `/${value}`;
  }
}

function addDuplicateIdErrors(values: string[], path: string, errors: string[]) {
  const seen = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (seen.has(value)) {
      errors.push(`${path}/${index}/id duplicates ${value}`);
    }
    seen.add(value);
  }
}

export function validateSuperPage(value: unknown): ValidationResult {
  const valid = validateSchema(value);
  const schemaErrors = valid ? [] : (validateSchema.errors ?? []).map(formatError);

  if (!valid) {
    return { valid: false, errors: schemaErrors };
  }

  const page = value as unknown as SuperPage;
  const semanticErrors: string[] = [];
  addDuplicateIdErrors(page.toc.map((item) => item.id), "/toc", semanticErrors);
  addDuplicateIdErrors(page.sections.map((section) => section.id), "/sections", semanticErrors);
  addDuplicateIdErrors(page.imageSlots.map((slot) => slot.id), "/imageSlots", semanticErrors);

  const tocIds = new Set(page.toc.map((item) => item.id));
  const sectionIds = new Set(page.sections.map((section) => section.id));
  const imageIds = new Set(page.imageSlots.map((slot) => slot.id));

  for (const section of page.sections) {
    if (!tocIds.has(section.id)) {
      semanticErrors.push(`/sections/${section.id} is missing from toc`);
    }
    if (!imageIds.has(section.imageSlotId)) {
      semanticErrors.push(`/sections/${section.id}/imageSlotId references missing image slot ${section.imageSlotId}`);
    }
  }

  for (const item of page.toc) {
    if (!sectionIds.has(item.id)) {
      semanticErrors.push(`/toc/${item.id} does not match a section id`);
    }
  }

  for (const slot of page.imageSlots) {
    if (!slot.alt.trim() || slot.alt.trim().length < 18) {
      semanticErrors.push(`/imageSlots/${slot.id}/alt must be descriptive`);
    }
    if (!slot.caption.trim() || slot.caption.trim().length < 18) {
      semanticErrors.push(`/imageSlots/${slot.id}/caption must be descriptive`);
    }
  }

  const finalBreadcrumb = page.breadcrumbs.at(-1);
  const expectedArticlePath = `/articles/${page.slug}`;
  if (!finalBreadcrumb) {
    semanticErrors.push("/breadcrumbs must include a current-page item");
  } else {
    if (finalBreadcrumb.href !== expectedArticlePath) {
      semanticErrors.push(`/breadcrumbs/current href must be ${expectedArticlePath}`);
    }
    if (canonicalPath(page.metadata.canonicalUrl) !== expectedArticlePath) {
      semanticErrors.push(`/metadata/canonicalUrl path must be ${expectedArticlePath}`);
    }
    if (!finalBreadcrumb.name.trim() || finalBreadcrumb.name !== page.metadata.title) {
      semanticErrors.push("/breadcrumbs/current name must match metadata.title");
    }
  }

  return { valid: semanticErrors.length === 0, errors: semanticErrors };
}

export function assertSuperPage(value: unknown): SuperPage {
  const result = validateSuperPage(value);
  if (!result.valid) {
    throw new Error(`Invalid Super Page:\n${result.errors.join("\n")}`);
  }
  return value as unknown as SuperPage;
}
