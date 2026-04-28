# SeoBlogerAgent

Open-source research project for building a stronger SEO Super Page generation platform.

## Purpose

This project explores how to build an open-source alternative to closed SEO writing tools by combining:

- Structured SEO Super Page planning.
- Provider-neutral AI content rewriting.
- Realistic article image generation.
- Quality gates that reduce generic AI tone.
- A self-hostable web UI.

The repository is for learning, research, and open-source experimentation. Do not commit secrets, competitor credentials, or proprietary competitor assets.

## Current MVP

Round 1 now includes a working Next.js App Router foundation:

- Machine-readable Super Page JSON schema: `content/schemas/super-page.schema.json`
- Positive sample fixture: `content/articles/demo-super-page/article.json`
- Negative validation fixtures: `content/articles/negative-*`
- Content and SEO validator: `scripts/validate-content.ts`
- Deterministic mock generation pipeline: `scripts/generate-mock.ts`
- Provider-neutral model routing contract: `src/models/gateway.ts`
- Image prompt and mock adapter contracts: `src/images/`
- Rendered article preview: `app/articles/[slug]/page.tsx`
- Authoring workflow UI: `app/workflow/page.tsx`

## Quick Start

```bash
npm install
npm run validate:content
npm run generate:mock
npm run build
npm run dev
```

Open locally:

- Home: `http://localhost:3000`
- Authoring workflow: `http://localhost:3000/workflow`
- Sample Super Page: `http://localhost:3000/articles/ai-seo-super-page-generator`

## Validation Commands

### Content and SEO validation

```bash
npm run validate:content
```

This validates:

- The positive Super Page fixture passes JSON schema and semantic checks.
- Negative fixtures fail with actionable error paths.
- SEO readiness catches duplicate canonicals, missing alt text, failing quality gates, and image QA failures.

### Mock generation

```bash
npm run generate:mock
```

This writes deterministic artifacts to:

```text
content/articles/demo-super-page/generated/generation-log.json
content/articles/demo-super-page/generated/image-metadata.json
content/articles/demo-super-page/generated/quality-report.json
```

### Build

```bash
npm run build
```

The build statically renders the home page, workflow page, and sample article route.

## Model Routing

The content engine is provider-neutral. The local default preference is `codex5.5pro`, but runtime configuration can route work to Codex/OpenAI-compatible models, Gemini, DeepSeek, Kimi/Moonshot, or future providers.

Provider-neutral environment variables:

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

The owner's machine may reuse private provider settings from:

```text
/Users/gs2ygc/injecttion-molding-agent/.env
```

Only variable names are documented. Secret values are not stored in this repository.

## Documentation

- `docs/draft.md` — original product idea converted into a Humanize draft.
- `docs/plan.md` — structured implementation plan and acceptance criteria.
- `docs/research/super-page-structure.md` — SEO Super Page structure research.
- `docs/research/framework-candidates.md` — candidate starter frameworks.
- `docs/research/framework-decision.md` — current framework decision.
- `docs/research/framework-validation.md` — local install/build validation for candidate frameworks.
- `docs/research/image-quality-rubric.md` — image quality checks and prompt rules.
- `docs/architecture/model-routing.md` — provider-neutral model routing design.
- `docs/architecture/initial-architecture.md` — initial system architecture.
- `docs/ui/kimi-consult-brief.md` — future UI design consultation brief.
- `docs/ui/kimi-review-log.md` — Round 1 Kimi UI review attempt and failure log.
- `docs/operations/humanize.md` — Humanize install, RLCR, and side-work operations.

## Safety Notes

- Do not commit `.env`, auth files, generated credentials, or local service clones.
- Competitor accounts are only for authorized product observation and must not be stored in repository files.
- Competitor UI may inform workflow understanding, but proprietary assets, exact branding, and trade dress should not be copied.
