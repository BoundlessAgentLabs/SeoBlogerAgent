# Model Routing and Local Provider Reuse

## Default Preference

The owner's current default preference is `codex5.5pro`, because local model APIs and proxy routing are already configured and known to work.

The content engine must not be hard-coded to Gemini only. Gemini remains one possible provider, especially for deep paragraph rewriting, but the architecture should support multiple providers:

- Codex / OpenAI-compatible proxy
- Gemini
- DeepSeek
- Kimi / Moonshot
- Future OpenAI-compatible providers

## Local Environment Source

The project should reuse the existing private environment file when running on the owner's machine:

```text
/Users/gs2ygc/injecttion-molding-agent/.env
```

Only variable names were inspected; secret values must never be printed or committed.

Detected reusable variable names:

```text
AI_API_KEY
AI_BASE_URL
AI_MODEL
AI_PROVIDER
APP_ORIGIN
DATABASE_URL
IMAGE_AI_API_KEY
IMAGE_AI_BASE_URL
IMAGE_AI_MODEL
IMAGE_AI_PROVIDER
NEXT_PUBLIC_API_BASE_URL
```

## Public Environment Contract

The repository includes `.env.example` for portable configuration. Real local values should be copied or loaded privately.

Provider-neutral variables should be preferred in app code:

```text
AI_PROVIDER
AI_MODEL
AI_BASE_URL
AI_API_KEY
IMAGE_AI_PROVIDER
IMAGE_AI_MODEL
IMAGE_AI_BASE_URL
IMAGE_AI_API_KEY
```

Provider-specific variables can exist as fallback aliases:

```text
OPENAI_API_KEY
OPENAI_BASE_URL
GEMINI_API_KEY
DEEPSEEK_API_KEY
KIMI_API_KEY
MOONSHOT_API_KEY
```

## Adapter Design

Implement a model gateway with a small common interface:

```ts
type ModelTask =
  | 'outline'
  | 'section-rewrite'
  | 'fact-review'
  | 'tone-review'
  | 'image-prompt'
  | 'image-generation';

interface TextModelAdapter {
  generateText(input: ModelRequest): Promise<ModelResponse>;
}

interface ImageModelAdapter {
  generateImage(input: ImageRequest): Promise<ImageResponse>;
  editImage(input: ImageEditRequest): Promise<ImageResponse>;
}
```

The default router should map tasks to models by config:

```text
outline -> AI_MODEL or codex5.5pro
section-rewrite -> AI_MODEL or codex5.5pro
fact-review -> AI_MODEL or codex5.5pro
image-prompt -> AI_MODEL or codex5.5pro
image-generation -> IMAGE_AI_MODEL or gpt-image-2
```

## Image Adapter Priority

1. Local `CodexImagen2API` during current experiments.
2. OpenAI-compatible image provider configured by `IMAGE_AI_*`.
3. Codex built-in `imagegen` workflow for manual asset work.

## Implementation Rule

Do not hard-code provider names in product logic. Product logic should request a task type; the model gateway chooses the provider and model.
