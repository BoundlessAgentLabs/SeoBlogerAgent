export type ModelTask = "outline" | "section-rewrite" | "fact-review" | "tone-review" | "image-prompt" | "image-generation";

export interface ModelRequest {
  task: ModelTask;
  input: string;
  context?: Record<string, unknown>;
}

export interface ModelResponse {
  provider: string;
  model: string;
  mode: "mock" | "live";
  output: string;
}

export interface ModelRoute {
  provider: string;
  model: string;
  baseUrl?: string;
  apiKeyPresent: boolean;
}

export function routeForTask(task: ModelTask, env: NodeJS.ProcessEnv = process.env): ModelRoute {
  const isImageTask = task === "image-generation";
  const provider = isImageTask ? env.IMAGE_AI_PROVIDER ?? "codex-imagen2api" : env.AI_PROVIDER ?? "openai-compatible";
  const model = isImageTask ? env.IMAGE_AI_MODEL ?? "gpt-image-2" : env.AI_MODEL ?? "codex5.5pro";
  const baseUrl = isImageTask ? env.IMAGE_AI_BASE_URL ?? env.CODEX_IMAGEN2_API_BASE_URL : env.AI_BASE_URL;
  const apiKeyPresent = Boolean(isImageTask ? env.IMAGE_AI_API_KEY ?? env.OPENAI_API_KEY : env.AI_API_KEY ?? env.OPENAI_API_KEY);

  return { provider, model, baseUrl, apiKeyPresent };
}

export async function generateTextMock(request: ModelRequest): Promise<ModelResponse> {
  const route = routeForTask(request.task);
  const compact = request.input.replace(/\s+/g, " ").trim().slice(0, 180);
  return {
    provider: route.provider,
    model: route.model,
    mode: "mock",
    output: `[mock:${request.task}] ${compact}`,
  };
}
