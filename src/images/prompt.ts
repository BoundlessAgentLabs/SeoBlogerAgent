import type { ImageSlot } from "@/super-page/types";

export interface ImagePromptRecord {
  imageSlotId: string;
  provider: string;
  status: "mock" | "planned" | "generated" | "needs-regeneration";
  prompt: string;
  alt: string;
  caption: string;
  qa: ImageSlot["qa"];
}

export function buildImagePrompt(slot: ImageSlot): string {
  return [
    `Subject: ${slot.prompt.subject}`,
    `Context: ${slot.prompt.context}`,
    `Composition: ${slot.prompt.composition}`,
    `Realism constraints: ${slot.prompt.realismConstraints.join("; ")}`,
    `Avoid: ${slot.prompt.avoid.join("; ")}`,
    "No logos, watermarks, or readable fake UI text unless explicitly requested.",
  ].join("\n");
}

export function imagePromptRecord(slot: ImageSlot): ImagePromptRecord {
  return {
    imageSlotId: slot.id,
    provider: slot.provider,
    status: slot.status,
    prompt: buildImagePrompt(slot),
    alt: slot.alt,
    caption: slot.caption,
    qa: slot.qa,
  };
}
