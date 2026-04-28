"use server";

import { getDefaultArticle } from "@/super-page/data";
import { generateWorkflowProject, type WorkflowProjectInput, type WorkflowProjectResult } from "@/workflow/generateProject";

export async function generateWorkflowProjectAction(input: WorkflowProjectInput): Promise<WorkflowProjectResult> {
  const normalizedTopic = input.topic.trim();
  if (normalizedTopic.length < 3) throw new Error("Topic must contain at least 3 characters.");
  return generateWorkflowProject({ ...input, topic: normalizedTopic }, getDefaultArticle());
}
