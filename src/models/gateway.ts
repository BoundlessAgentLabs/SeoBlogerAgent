import { buildPrompt, type PromptTemplate } from "./prompts";
import { validateTaskOutput, type ValidatedTaskOutput } from "./validation";
import type { SuperPage } from "@/super-page/types";
import { reviewTextQuality } from "@/quality/content";

export type ModelTask = "outline" | "section-rewrite" | "fact-review" | "tone-review" | "unsupported-stat-review" | "fake-citation-review" | "image-prompt" | "image-generation";
export type ModelMode = "mock" | "live";

export interface ModelRequest {
  task: ModelTask;
  input: string;
  prompt?: PromptTemplate;
  context?: Record<string, unknown>;
  mode?: ModelMode;
}

export interface ModelResponse<T = unknown> {
  provider: string;
  model: string;
  mode: ModelMode;
  task: ModelTask;
  promptId?: string;
  request: {
    system?: string;
    user: string;
    expectedJsonShape?: string;
  };
  output: T;
  rawText: string;
  warnings: string[];
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export interface ModelRoute {
  provider: string;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  apiKeyPresent: boolean;
  endpoint: "chat-completions" | "gemini-generate-content";
}

function firstPresent(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim().length > 0);
}

export function routeForTask(task: ModelTask, env: NodeJS.ProcessEnv = process.env): ModelRoute {
  const isImageTask = task === "image-generation";
  const provider = (isImageTask ? env.IMAGE_AI_PROVIDER ?? "codex-imagen2api" : env.AI_PROVIDER ?? "openai-compatible").toLowerCase();
  const model = isImageTask ? env.IMAGE_AI_MODEL ?? "gpt-image-2" : env.AI_MODEL ?? "codex5.5pro";

  if (isImageTask) {
    const baseUrl = firstPresent(env.IMAGE_AI_BASE_URL, env.CODEX_IMAGEN2_API_BASE_URL);
    const apiKey = firstPresent(env.IMAGE_AI_API_KEY, env.OPENAI_API_KEY, env.AI_API_KEY);
    return { provider, model, baseUrl, apiKey, apiKeyPresent: Boolean(apiKey), endpoint: "chat-completions" };
  }

  if (provider === "gemini") {
    const baseUrl = firstPresent(env.GEMINI_BASE_URL, env.AI_BASE_URL, "https://generativelanguage.googleapis.com/v1beta");
    const apiKey = firstPresent(env.GEMINI_API_KEY, env.AI_API_KEY);
    return { provider, model, baseUrl, apiKey, apiKeyPresent: Boolean(apiKey), endpoint: "gemini-generate-content" };
  }

  if (provider === "kimi" || provider === "moonshot") {
    const baseUrl = firstPresent(env.KIMI_BASE_URL, env.MOONSHOT_BASE_URL, env.AI_BASE_URL, "https://api.moonshot.cn/v1");
    const apiKey = firstPresent(env.KIMI_API_KEY, env.MOONSHOT_API_KEY, env.AI_API_KEY);
    return { provider, model, baseUrl, apiKey, apiKeyPresent: Boolean(apiKey), endpoint: "chat-completions" };
  }

  if (provider === "deepseek") {
    const baseUrl = firstPresent(env.DEEPSEEK_BASE_URL, env.AI_BASE_URL, "https://api.deepseek.com");
    const apiKey = firstPresent(env.DEEPSEEK_API_KEY, env.AI_API_KEY);
    return { provider, model, baseUrl, apiKey, apiKeyPresent: Boolean(apiKey), endpoint: "chat-completions" };
  }

  const baseUrl = firstPresent(env.AI_BASE_URL, env.OPENAI_BASE_URL);
  const apiKey = firstPresent(env.AI_API_KEY, env.OPENAI_API_KEY);
  return { provider, model, baseUrl, apiKey, apiKeyPresent: Boolean(apiKey), endpoint: "chat-completions" };
}

function requestFromPrompt(request: ModelRequest) {
  return {
    system: request.prompt?.system,
    user: request.prompt?.user ?? request.input,
    expectedJsonShape: request.prompt?.expectedJsonShape,
  };
}

function deterministicOutline(page: SuperPage) {
  return {
    sections: page.sections.map((section) => ({
      id: section.id,
      heading: section.heading,
      searchIntent: section.searchIntent,
    })),
  };
}

function deterministicRewrite(section: SuperPage["sections"][number]) {
  const firstSource = section.sourceNotes[0]?.note ?? section.summaryClaim;
  const include = section.generationConstraints.mustInclude.join(", ");
  return {
    paragraphs: [
      `${section.summaryClaim} ${firstSource} This rewrite stays focused on ${section.searchIntent.toLowerCase()} while adding ${include}.`,
      `For implementation, the editor sees why this block exists, which claims are grounded, and which caveats remain. This keeps retries local to the section instead of regenerating the entire article.`,
    ],
    examples: section.examples,
    caveats: section.caveats,
    qualityNotes: [`Mock rewrite used ${section.sourceNotes.length} source notes and ${section.generationConstraints.mustInclude.length} must-include constraints.`],
  };
}

function mockOutput(request: ModelRequest) {
  if (request.task === "outline" && request.context?.page) {
    return deterministicOutline(request.context.page as SuperPage);
  }

  if (request.task === "section-rewrite" && request.context?.section) {
    return deterministicRewrite(request.context.section as SuperPage["sections"][number]);
  }

  if (request.task === "image-prompt") {
    return { subject: "Realistic editorial workflow desk", context: request.input, composition: "documentary-style workspace composition", avoid: ["fake text", "stock-photo grin", "floating UI"] };
  }

  if (request.task === "image-generation") {
    return { prompt: request.input };
  }

  const issues = reviewTextQuality(request.input);
  const relevant = issues.filter((issue) => {
    if (request.task === "tone-review") return issue.id === "generic-ai-intro";
    if (request.task === "unsupported-stat-review") return issue.id === "unsupported-statistic";
    if (request.task === "fake-citation-review") return issue.id === "fake-citation";
    return true;
  });
  return { status: relevant.length > 0 ? "fail" : "pass", issues: relevant.map((issue) => issue.evidence) };
}

function validateOrThrow(task: ModelTask, value: unknown): { output: ValidatedTaskOutput; errors: string[] } {
  const validation = validateTaskOutput(task, value);
  if (validation.errors.length > 0) {
    return validation;
  }
  return validation;
}

function parseJsonish(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return JSON.parse(fenced[1]);
    const objectStart = rawText.indexOf("{");
    const objectEnd = rawText.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) return JSON.parse(rawText.slice(objectStart, objectEnd + 1));
    throw new Error("Provider response was not valid JSON for the requested task output shape.");
  }
}

async function callChatCompletions(route: ModelRoute, sharedRequest: ReturnType<typeof requestFromPrompt>) {
  const response = await fetch(`${route.baseUrl?.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${route.apiKey}`,
    },
    body: JSON.stringify({
      model: route.model,
      messages: [
        ...(sharedRequest.system ? [{ role: "system", content: sharedRequest.system }] : []),
        { role: "user", content: `${sharedRequest.user}\n\nReturn only valid JSON matching this shape: ${sharedRequest.expectedJsonShape ?? "JSON object"}` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
  return { response, rawText };
}

async function callGemini(route: ModelRoute, sharedRequest: ReturnType<typeof requestFromPrompt>) {
  const endpoint = `${route.baseUrl?.replace(/\/$/, "")}/models/${route.model}:generateContent?key=${encodeURIComponent(route.apiKey ?? "")}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${sharedRequest.system ? `${sharedRequest.system}\n\n` : ""}${sharedRequest.user}\n\nReturn only valid JSON matching this shape: ${sharedRequest.expectedJsonShape ?? "JSON object"}` }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? JSON.stringify(data);
  return { response, rawText };
}

export async function generateWithModel<T = unknown>(request: ModelRequest, env: NodeJS.ProcessEnv = process.env): Promise<ModelResponse<T>> {
  const route = routeForTask(request.task, env);
  const mode = request.mode ?? (env.AI_LIVE === "true" ? "live" : "mock");
  const sharedRequest = requestFromPrompt(request);

  if (mode === "mock") {
    const value = mockOutput(request);
    const validation = validateOrThrow(request.task, value);
    return {
      provider: route.provider,
      model: route.model,
      mode,
      task: request.task,
      promptId: request.prompt?.id,
      request: sharedRequest,
      output: validation.output as T,
      rawText: JSON.stringify(value),
      warnings: validation.errors,
      validation: { valid: validation.errors.length === 0, errors: validation.errors },
    };
  }

  if (!route.baseUrl || !route.apiKeyPresent) {
    const blocked = { status: "fail", issues: [`Missing provider credentials for ${route.provider}.`] };
    const validation = validateTaskOutput(request.task, blocked);
    return {
      provider: route.provider,
      model: route.model,
      mode: "live",
      task: request.task,
      promptId: request.prompt?.id,
      request: sharedRequest,
      output: (validation.output ?? blocked) as T,
      rawText: JSON.stringify(blocked),
      warnings: ["live-provider-credentials-missing", ...validation.errors],
      validation: { valid: false, errors: [`Missing base URL or API key for provider ${route.provider}.`, ...validation.errors] },
    };
  }

  const { response, rawText } = route.endpoint === "gemini-generate-content" ? await callGemini(route, sharedRequest) : await callChatCompletions(route, sharedRequest);
  let parsed: unknown;
  const parseWarnings: string[] = [];
  try {
    parsed = parseJsonish(rawText);
  } catch (error) {
    parsed = {};
    parseWarnings.push(error instanceof Error ? error.message : String(error));
  }
  const validation = validateOrThrow(request.task, parsed);
  const warnings = [...parseWarnings, ...(response.ok ? [] : [`HTTP ${response.status}`]), ...validation.errors];
  return {
    provider: route.provider,
    model: route.model,
    mode,
    task: request.task,
    promptId: request.prompt?.id,
    request: sharedRequest,
    output: validation.output as T,
    rawText,
    warnings,
    validation: { valid: response.ok && validation.errors.length === 0 && parseWarnings.length === 0, errors: warnings },
  };
}

export function promptForSection(task: ModelTask, page: SuperPage, section: SuperPage["sections"][number]) {
  return buildPrompt(task, { page, section });
}

export function promptForPage(task: ModelTask, page: SuperPage) {
  return buildPrompt(task, { page });
}
