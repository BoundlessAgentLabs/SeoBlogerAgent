import type { ModelTask } from "./gateway";

export type ReviewStatus = "pass" | "warn" | "fail";

export interface OutlineOutput {
  sections: Array<{ id: string; heading: string; searchIntent: string }>;
}

export interface SectionRewriteOutput {
  paragraphs: string[];
  examples: string[];
  caveats: string[];
  qualityNotes: string[];
}

export interface ReviewOutput {
  status: ReviewStatus;
  issues: string[];
}

export interface ImagePromptOutput {
  subject: string;
  context: string;
  composition: string;
  avoid: string[];
}

export interface ImageGenerationOutput {
  prompt: string;
}

export interface TaskValidationOptions {
  expectedOutlineIds?: string[];
}

export type ValidatedTaskOutput = OutlineOutput | SectionRewriteOutput | ReviewOutput | ImagePromptOutput | ImageGenerationOutput;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown, path: string, errors: string[], options: { minItems?: number } = {}): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array of strings`);
    return [];
  }
  const strings = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (strings.length !== value.length) errors.push(`${path} must contain only non-empty strings`);
  if (options.minItems && strings.length < options.minItems) errors.push(`${path} must contain at least ${options.minItems} item(s)`);
  return strings;
}

function requireString(value: unknown, path: string, errors: string[]): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${path} must be a non-empty string`);
    return "";
  }
  return value;
}

function validateOutline(value: unknown, errors: string[], options: TaskValidationOptions): OutlineOutput {
  if (!isRecord(value)) {
    errors.push("/output must be an object");
    return { sections: [] };
  }
  if (!Array.isArray(value.sections) || value.sections.length === 0) {
    errors.push("/sections must contain at least one outline section");
    return { sections: [] };
  }
  const sections = value.sections.map((item, index) => {
    if (!isRecord(item)) {
      errors.push(`/sections/${index} must be an object`);
      return { id: "", heading: "", searchIntent: "" };
    }
    return {
      id: requireString(item.id, `/sections/${index}/id`, errors),
      heading: requireString(item.heading, `/sections/${index}/heading`, errors),
      searchIntent: requireString(item.searchIntent, `/sections/${index}/searchIntent`, errors),
    };
  });

  if (options.expectedOutlineIds && options.expectedOutlineIds.length > 0) {
    const actualIds = sections.map((section) => section.id);
    const expectedIds = options.expectedOutlineIds;
    if (actualIds.length !== expectedIds.length) {
      errors.push(`/sections length ${actualIds.length} does not match expected Super Page section count ${expectedIds.length}`);
    }
    expectedIds.forEach((expectedId, index) => {
      if (actualIds[index] !== expectedId) {
        errors.push(`/sections/${index}/id must be ${expectedId} for this Super Page contract, got ${actualIds[index] || "<missing>"}`);
      }
    });
  }

  return { sections };
}

function validateRewrite(value: unknown, errors: string[]): SectionRewriteOutput {
  if (!isRecord(value)) {
    errors.push("/output must be an object");
    return { paragraphs: [], examples: [], caveats: [], qualityNotes: [] };
  }
  return {
    paragraphs: stringArray(value.paragraphs, "/paragraphs", errors, { minItems: 2 }),
    examples: stringArray(value.examples, "/examples", errors, { minItems: 1 }),
    caveats: stringArray(value.caveats, "/caveats", errors, { minItems: 1 }),
    qualityNotes: stringArray(value.qualityNotes, "/qualityNotes", errors, { minItems: 1 }),
  };
}

function validateReview(value: unknown, errors: string[]): ReviewOutput {
  if (!isRecord(value)) {
    errors.push("/output must be an object");
    return { status: "fail", issues: ["invalid review output"] };
  }
  const status = value.status;
  if (status !== "pass" && status !== "warn" && status !== "fail") errors.push("/status must be pass, warn, or fail");
  return {
    status: status === "pass" || status === "warn" || status === "fail" ? status : "fail",
    issues: stringArray(value.issues, "/issues", errors),
  };
}

function validateImagePrompt(value: unknown, errors: string[]): ImagePromptOutput {
  if (!isRecord(value)) {
    errors.push("/output must be an object");
    return { subject: "", context: "", composition: "", avoid: [] };
  }
  return {
    subject: requireString(value.subject, "/subject", errors),
    context: requireString(value.context, "/context", errors),
    composition: requireString(value.composition, "/composition", errors),
    avoid: stringArray(value.avoid, "/avoid", errors, { minItems: 1 }),
  };
}

function validateImageGeneration(value: unknown, errors: string[]): ImageGenerationOutput {
  if (!isRecord(value)) {
    errors.push("/output must be an object");
    return { prompt: "" };
  }
  return { prompt: requireString(value.prompt, "/prompt", errors) };
}

export function validateTaskOutput(task: ModelTask, value: unknown, options: TaskValidationOptions = {}): { output: ValidatedTaskOutput; errors: string[] } {
  const errors: string[] = [];
  const output = (() => {
    if (task === "outline") return validateOutline(value, errors, options);
    if (task === "section-rewrite") return validateRewrite(value, errors);
    if (task === "image-prompt") return validateImagePrompt(value, errors);
    if (task === "image-generation") return validateImageGeneration(value, errors);
    return validateReview(value, errors);
  })();
  return { output, errors };
}
