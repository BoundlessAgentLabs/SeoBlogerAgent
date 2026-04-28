import type { Metadata } from "next";
import { AuthoringWorkflow } from "@/components/AuthoringWorkflow";
import { getDefaultArticle } from "@/super-page/data";

export const metadata: Metadata = {
  title: "Authoring Workflow",
  description: "Review topic input, Super Page structure, mock generation state, image prompts, quality gates, and preview links.",
};

export default function WorkflowPage() {
  return <AuthoringWorkflow page={getDefaultArticle()} />;
}
