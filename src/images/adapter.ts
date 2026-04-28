import type { ImagePromptRecord } from "./prompt";

export type ImageProvider = "mock" | "codex-imagen2api" | "openai-compatible";

export interface ImageGenerationRequest {
  articleSlug: string;
  prompt: ImagePromptRecord;
  mode?: "mock" | "live";
}

export interface ImageGenerationResult {
  provider: string;
  mode: "mock" | "live" | "blocked";
  imageSlotId: string;
  assetPath?: string;
  metadata: ImagePromptRecord;
  providerRequest?: unknown;
  providerResponse?: unknown;
  blocker?: string;
  regenerationRecommended: boolean;
}

function providerFromEnv(env: NodeJS.ProcessEnv = process.env): ImageProvider {
  const provider = env.IMAGE_AI_PROVIDER ?? "codex-imagen2api";
  if (provider === "openai-compatible" || provider === "codex-imagen2api") return provider;
  return "mock";
}

function shouldRegenerate(prompt: ImagePromptRecord) {
  return prompt.qa.relevance === "fail" || prompt.qa.textArtifacts === "fail" || prompt.qa.realism === "fail";
}

export async function generateMockImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  return {
    provider: request.prompt.provider || "mock",
    mode: "mock",
    imageSlotId: request.prompt.imageSlotId,
    assetPath: `/mock-images/${request.prompt.imageSlotId}.svg`,
    metadata: request.prompt,
    regenerationRecommended: shouldRegenerate(request.prompt),
  };
}

export async function generateLiveImageAttempt(request: ImageGenerationRequest, env: NodeJS.ProcessEnv = process.env): Promise<ImageGenerationResult> {
  const provider = providerFromEnv(env);
  const promptText = request.prompt.prompt;

  if (provider === "mock") {
    return generateMockImage(request);
  }

  if (provider === "codex-imagen2api") {
    const baseUrl = env.CODEX_IMAGEN2_API_BASE_URL ?? env.IMAGE_AI_BASE_URL;
    const providerRequest = {
      url: `${baseUrl ?? ""}/v1/chat/completions`,
      body: {
        model: env.IMAGE_AI_MODEL ?? "gpt-4o-image",
        stream: false,
        messages: [{ role: "user", content: promptText }],
      },
    };

    if (!baseUrl) {
      return {
        provider,
        mode: "blocked",
        imageSlotId: request.prompt.imageSlotId,
        metadata: request.prompt,
        providerRequest,
        blocker: "Missing CODEX_IMAGEN2_API_BASE_URL or IMAGE_AI_BASE_URL for CodexImagen2API image generation.",
        regenerationRecommended: shouldRegenerate(request.prompt),
      };
    }

    return {
      provider,
      mode: "blocked",
      imageSlotId: request.prompt.imageSlotId,
      metadata: request.prompt,
      providerRequest,
      blocker: "Live image execution is disabled in this credential-safe command; request shape is ready for CodexImagen2API.",
      regenerationRecommended: shouldRegenerate(request.prompt),
    };
  }

  const baseUrl = env.IMAGE_AI_BASE_URL;
  const apiKey = env.IMAGE_AI_API_KEY ?? env.OPENAI_API_KEY;
  const providerRequest = {
    url: `${baseUrl ?? ""}/images/generations`,
    body: {
      model: env.IMAGE_AI_MODEL ?? "gpt-image-2",
      prompt: promptText,
      size: "1024x1024",
      quality: "high",
      output_format: "png",
    },
  };

  if (!baseUrl || !apiKey) {
    return {
      provider,
      mode: "blocked",
      imageSlotId: request.prompt.imageSlotId,
      metadata: request.prompt,
      providerRequest,
      blocker: "Missing IMAGE_AI_BASE_URL and/or IMAGE_AI_API_KEY for OpenAI-compatible image generation.",
      regenerationRecommended: shouldRegenerate(request.prompt),
    };
  }

  return {
    provider,
    mode: "blocked",
    imageSlotId: request.prompt.imageSlotId,
    metadata: request.prompt,
    providerRequest,
    blocker: "Live image execution is intentionally skipped by the deterministic generation command; use a dedicated live generation command to spend image quota.",
    regenerationRecommended: shouldRegenerate(request.prompt),
  };
}
