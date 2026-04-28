import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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

interface ExtractedImage {
  bytes: Buffer;
  mimeType: string;
  source: "b64_json" | "data-url" | "url";
}

function providerFromEnv(env: NodeJS.ProcessEnv = process.env): ImageProvider {
  const provider = env.IMAGE_AI_PROVIDER ?? "codex-imagen2api";
  if (provider === "openai-compatible" || provider === "codex-imagen2api") return provider;
  return "mock";
}

function shouldRegenerate(prompt: ImagePromptRecord) {
  return prompt.qa.relevance === "fail" || prompt.qa.textArtifacts === "fail" || prompt.qa.realism === "fail";
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

function saveImage(articleSlug: string, imageSlotId: string, image: ExtractedImage) {
  const extension = extensionForMime(image.mimeType);
  const publicDir = join(process.cwd(), "public", "generated", articleSlug);
  mkdirSync(publicDir, { recursive: true });
  const fileName = `${imageSlotId}.${extension}`;
  writeFileSync(join(publicDir, fileName), image.bytes);
  return `/generated/${articleSlug}/${fileName}`;
}

function extractDataUrl(value: string): ExtractedImage | null {
  const match = value.match(/data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\n\r]+)/);
  if (!match) return null;
  return { bytes: Buffer.from(match[2].replace(/\s/g, ""), "base64"), mimeType: match[1], source: "data-url" };
}

async function extractImageFromPayload(payload: unknown): Promise<ExtractedImage> {
  const data = payload as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; image_url?: { url?: string }; text?: string }> } }>;
    data?: Array<{ b64_json?: string; url?: string; mime_type?: string }>;
  };

  const b64 = data.data?.find((item) => item.b64_json)?.b64_json;
  if (b64) return { bytes: Buffer.from(b64, "base64"), mimeType: data.data?.[0]?.mime_type ?? "image/png", source: "b64_json" };

  const dataUrlInUrl = data.data?.find((item) => item.url?.startsWith("data:image/"))?.url;
  if (dataUrlInUrl) {
    const extracted = extractDataUrl(dataUrlInUrl);
    if (extracted) return extracted;
  }

  const remoteUrl = data.data?.find((item) => item.url && !item.url.startsWith("data:"))?.url;
  if (remoteUrl) {
    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error(`Image URL download failed with HTTP ${response.status}`);
    const mimeType = response.headers.get("content-type") ?? "image/png";
    return { bytes: Buffer.from(await response.arrayBuffer()), mimeType, source: "url" };
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    const extracted = extractDataUrl(content);
    if (extracted) return extracted;
  }

  if (Array.isArray(content)) {
    for (const part of content) {
      const maybeUrl = part.image_url?.url ?? part.text;
      if (maybeUrl?.startsWith("data:image/")) {
        const extracted = extractDataUrl(maybeUrl);
        if (extracted) return extracted;
      }
    }
  }

  throw new Error("Provider response did not contain b64_json, data URL, or downloadable image URL.");
}

function redactedRequest(url: string, body: unknown) {
  return { url, body };
}

function redactedResponse(payload: unknown, image: ExtractedImage) {
  const data = payload as { id?: string; model?: string; usage?: unknown; choices?: Array<{ finish_reason?: string }>; created?: number };
  return {
    id: data.id,
    model: data.model,
    created: data.created,
    finishReason: data.choices?.[0]?.finish_reason,
    usage: data.usage,
    imageSource: image.source,
    mimeType: image.mimeType,
    bytes: image.bytes.length,
  };
}

function blockedResult(request: ImageGenerationRequest, provider: ImageProvider, providerRequest: unknown, blocker: string, providerResponse?: unknown): ImageGenerationResult {
  return {
    provider,
    mode: "blocked",
    imageSlotId: request.prompt.imageSlotId,
    metadata: request.prompt,
    providerRequest,
    providerResponse,
    blocker,
    regenerationRecommended: shouldRegenerate(request.prompt),
  };
}

async function readJsonSafely(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { rawTextPreview: text.slice(0, 500), parseError: "Provider returned non-JSON response." };
  }
}

async function postJson(url: string, body: unknown, headers: Record<string, string>) {
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const payload = await readJsonSafely(response);
  return { response, payload };
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
  if (provider === "mock") return generateMockImage(request);

  if (provider === "codex-imagen2api") {
    const baseUrl = env.CODEX_IMAGEN2_API_BASE_URL ?? env.IMAGE_AI_BASE_URL;
    const url = `${baseUrl ?? ""}/v1/chat/completions`;
    const body = { model: env.IMAGE_AI_MODEL ?? "gpt-4o-image", stream: false, messages: [{ role: "user", content: promptText }] };
    const providerRequest = redactedRequest(url, body);
    if (!baseUrl) return blockedResult(request, provider, providerRequest, "Missing CODEX_IMAGEN2_API_BASE_URL or IMAGE_AI_BASE_URL for CodexImagen2API image generation.");

    try {
      const { response, payload } = await postJson(url, body, { "Content-Type": "application/json" });
      if (!response.ok) return blockedResult(request, provider, providerRequest, `CodexImagen2API request failed with HTTP ${response.status}.`, { status: response.status, error: payload?.error?.message ?? payload?.detail ?? payload?.parseError ?? "request failed" });
      const image = await extractImageFromPayload(payload);
      const assetPath = saveImage(request.articleSlug, request.prompt.imageSlotId, image);
      return { provider, mode: "live", imageSlotId: request.prompt.imageSlotId, assetPath, metadata: { ...request.prompt, provider, status: "generated" }, providerRequest, providerResponse: redactedResponse(payload, image), regenerationRecommended: shouldRegenerate(request.prompt) };
    } catch (error) {
      return blockedResult(request, provider, providerRequest, error instanceof Error ? error.message : String(error), { errorType: "network-or-image-extraction" });
    }
  }

  const baseUrl = env.IMAGE_AI_BASE_URL;
  const apiKey = env.IMAGE_AI_API_KEY ?? env.OPENAI_API_KEY;
  const url = `${baseUrl ?? ""}/images/generations`;
  const body = { model: env.IMAGE_AI_MODEL ?? "gpt-image-2", prompt: promptText, size: "1024x1024", quality: "high", output_format: "png" };
  const providerRequest = redactedRequest(url, body);
  if (!baseUrl || !apiKey) return blockedResult(request, provider, providerRequest, "Missing IMAGE_AI_BASE_URL and/or IMAGE_AI_API_KEY for OpenAI-compatible image generation.");

  try {
    const { response, payload } = await postJson(url, body, { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` });
    if (!response.ok) return blockedResult(request, provider, providerRequest, `OpenAI-compatible image request failed with HTTP ${response.status}.`, { status: response.status, error: payload?.error?.message ?? payload?.parseError ?? "request failed" });
    const image = await extractImageFromPayload(payload);
    const assetPath = saveImage(request.articleSlug, request.prompt.imageSlotId, image);
    return { provider, mode: "live", imageSlotId: request.prompt.imageSlotId, assetPath, metadata: { ...request.prompt, provider, status: "generated" }, providerRequest, providerResponse: redactedResponse(payload, image), regenerationRecommended: shouldRegenerate(request.prompt) };
  } catch (error) {
    return blockedResult(request, provider, providerRequest, error instanceof Error ? error.message : String(error), { errorType: "network-or-image-extraction" });
  }
}
