import { buildPrompt, type PromptTemplate } from "./prompts";
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

function requestFromPrompt(request: ModelRequest) {
  return {
    system: request.prompt?.system,
    user: request.prompt?.user ?? request.input,
    expectedJsonShape: request.prompt?.expectedJsonShape,
  };
}

function deterministicRewrite(section: SuperPage["sections"][number]) {
  const firstSource = section.sourceNotes[0]?.note ?? section.summaryClaim;
  const include = section.generationConstraints.mustInclude.join(", ");
  return {
    paragraphs: [
      `${section.summaryClaim} ${firstSource} A useful rewrite keeps the section focused on ${section.searchIntent.toLowerCase()} while adding ${include}.`,
      `For implementation, the editor should see why this block exists, which claims are grounded, and which caveats remain. This keeps retries local to the section instead of regenerating the entire article.`,
    ],
    examples: section.examples,
    caveats: section.caveats,
    qualityNotes: [`Mock rewrite used ${section.sourceNotes.length} source notes and ${section.generationConstraints.mustInclude.length} must-include constraints.`],
  };
}

function mockOutput(request: ModelRequest) {
  if (request.task === "section-rewrite" && request.context?.section) {
    return deterministicRewrite(request.context.section as SuperPage["sections"][number]);
  }

  if (request.task === "fact-review" || request.task === "tone-review" || request.task === "unsupported-stat-review" || request.task === "fake-citation-review") {
    const issues = reviewTextQuality(request.input);
    const relevant = issues.filter((issue) => {
      if (request.task === "tone-review") return issue.id === "generic-ai-intro";
      if (request.task === "unsupported-stat-review") return issue.id === "unsupported-statistic";
      if (request.task === "fake-citation-review") return issue.id === "fake-citation";
      return true;
    });
    return { status: relevant.length > 0 ? "fail" : "pass", issues: relevant.map((issue) => issue.evidence) };
  }

  return { text: `[mock:${request.task}] ${request.input.replace(/\s+/g, " ").trim().slice(0, 180)}` };
}

export async function generateWithModel<T = unknown>(request: ModelRequest, env: NodeJS.ProcessEnv = process.env): Promise<ModelResponse<T>> {
  const route = routeForTask(request.task, env);
  const mode = request.mode ?? (env.AI_LIVE === "true" ? "live" : "mock");
  const sharedRequest = requestFromPrompt(request);

  if (mode === "mock") {
    const output = mockOutput(request) as T;
    return {
      provider: route.provider,
      model: route.model,
      mode,
      task: request.task,
      promptId: request.prompt?.id,
      request: sharedRequest,
      output,
      rawText: JSON.stringify(output),
      warnings: [],
    };
  }

  if (!route.baseUrl || !route.apiKeyPresent) {
    return {
      provider: route.provider,
      model: route.model,
      mode: "live",
      task: request.task,
      promptId: request.prompt?.id,
      request: sharedRequest,
      output: { status: "blocked", reason: "Missing AI_BASE_URL or AI_API_KEY for live provider execution." } as T,
      rawText: "",
      warnings: ["live-provider-credentials-missing"],
    };
  }

  const response = await fetch(`${route.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_API_KEY ?? env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: route.model,
      messages: [
        ...(sharedRequest.system ? [{ role: "system", content: sharedRequest.system }] : []),
        { role: "user", content: `${sharedRequest.user}\n\nReturn shape: ${sharedRequest.expectedJsonShape ?? "JSON"}` },
      ],
    }),
  });
  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
  let output: T;
  try {
    output = JSON.parse(rawText) as T;
  } catch {
    output = { text: rawText } as T;
  }
  return { provider: route.provider, model: route.model, mode, task: request.task, promptId: request.prompt?.id, request: sharedRequest, output, rawText, warnings: response.ok ? [] : [`HTTP ${response.status}`] };
}

export function promptForSection(task: ModelTask, page: SuperPage, section: SuperPage["sections"][number]) {
  return buildPrompt(task, { page, section });
}
