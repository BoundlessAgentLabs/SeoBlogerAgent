import type { ImagePromptRecord } from "./prompt";

export interface ImageGenerationRequest {
  articleSlug: string;
  prompt: ImagePromptRecord;
}

export interface ImageGenerationResult {
  provider: string;
  mode: "mock" | "live";
  imageSlotId: string;
  assetPath: string;
  metadata: ImagePromptRecord;
}

export async function generateMockImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  return {
    provider: request.prompt.provider || "mock",
    mode: "mock",
    imageSlotId: request.prompt.imageSlotId,
    assetPath: `/mock-images/${request.prompt.imageSlotId}.svg`,
    metadata: request.prompt,
  };
}
