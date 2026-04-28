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

export function validateSuperPage(value: unknown): ValidationResult {
  const valid = validateSchema(value);
  const schemaErrors = valid ? [] : (validateSchema.errors ?? []).map(formatError);

  if (!valid) {
    return { valid: false, errors: schemaErrors };
  }

  const page = value as unknown as SuperPage;
  const semanticErrors: string[] = [];
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

  return { valid: semanticErrors.length === 0, errors: semanticErrors };
}

export function assertSuperPage(value: unknown): SuperPage {
  const result = validateSuperPage(value);
  if (!result.valid) {
    throw new Error(`Invalid Super Page:\n${result.errors.join("\n")}`);
  }
  return value as unknown as SuperPage;
}
