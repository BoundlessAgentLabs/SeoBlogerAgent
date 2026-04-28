"use server";

import { revalidatePath } from "next/cache";
import { getDefaultArticle } from "@/super-page/data";
import { generateWorkflowProject, type WorkflowProjectInput, type WorkflowProjectResult } from "@/workflow/generateProject";

type WorkflowActionInput = WorkflowProjectInput & { accessToken?: string };

const LIMITS = {
  topic: 160,
  customerAction: 240,
  targetLocation: 120,
  brandVoice: 160,
  imageModelPreference: 120,
};

function cleanField(value: string | undefined, field: keyof typeof LIMITS) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (normalized.length > LIMITS[field]) throw new Error(`${field} must be ${LIMITS[field]} characters or fewer.`);
  return normalized;
}

function requirePersistenceAccess(accessToken: string | undefined) {
  const secret = process.env.WORKFLOW_ACTION_SECRET?.trim();
  if (!secret) throw new Error("Workflow persistence is disabled. Set WORKFLOW_ACTION_SECRET and provide the matching access key, or use npm run generate:workflow locally.");
  if (accessToken !== secret) throw new Error("Invalid workflow access key.");
}

export async function generateWorkflowProjectAction(input: WorkflowActionInput): Promise<WorkflowProjectResult> {
  const normalizedTopic = cleanField(input.topic, "topic");
  if (!normalizedTopic || normalizedTopic.length < 3) throw new Error("Topic must contain at least 3 characters.");
  const normalizedInput = {
    topic: normalizedTopic,
    customerAction: cleanField(input.customerAction, "customerAction"),
    targetLocation: cleanField(input.targetLocation, "targetLocation"),
    brandVoice: cleanField(input.brandVoice, "brandVoice"),
    imageModelPreference: cleanField(input.imageModelPreference, "imageModelPreference"),
  };
  requirePersistenceAccess(input.accessToken?.trim());
  const result = await generateWorkflowProject(normalizedInput, getDefaultArticle());
  revalidatePath("/articles");
  revalidatePath(`/articles/${result.slug}`);
  revalidatePath(`/workflow/preview/${result.slug}`);
  return result;
}
