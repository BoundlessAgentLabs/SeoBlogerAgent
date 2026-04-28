"use server";

import { getDefaultArticle } from "@/super-page/data";
import { generateWorkflowProject, type WorkflowProjectResult } from "@/workflow/generateProject";

export async function generateWorkflowProjectAction(topic: string): Promise<WorkflowProjectResult> {
  const normalizedTopic = topic.trim();
  if (normalizedTopic.length < 3) throw new Error("Topic must contain at least 3 characters.");
  return generateWorkflowProject(normalizedTopic, getDefaultArticle());
}
