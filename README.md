# SeoBlogerAgent

Open-source research project for building a stronger SEO Super Page generation platform.

## Purpose

This project is for learning and research. It explores how to build an open-source alternative to closed SEO writing tools by combining:

- Structured SEO Super Page planning.
- Provider-neutral AI content rewriting.
- Realistic article image generation.
- Quality gates that reduce generic AI tone.
- A self-hostable web UI.

## Current Direction

The current plan is documented in `docs/plan.md`.

Key decisions:

- Super Pages are generated block-by-block, not as one giant article prompt.
- The content engine is provider-neutral and can use Codex/OpenAI-compatible models, Gemini, DeepSeek, Kimi/Moonshot, or future providers.
- The local default preference is `codex5.5pro` when available through the owner's configured proxy.
- Image generation is treated as a first-class pipeline, with local `CodexImagen2API` experiments and future GPT Image adapters.
- UI design will use `kimi-consult` once a real app shell exists.
- Implementation should proceed with Humanize RLCR review loops.

## Local Environment

Do not commit real secrets. Copy `.env.example` and provide private values locally.

The owner's machine can reuse private provider settings from:

```text
/Users/gs2ygc/injecttion-molding-agent/.env
```

Only variable names are documented; secret values are not stored in this repository.

## Documentation

- `docs/draft.md` — original product idea converted into a Humanize draft.
- `docs/plan.md` — structured implementation plan and acceptance criteria.
- `docs/research/super-page-structure.md` — SEO Super Page structure research.
- `docs/research/framework-candidates.md` — candidate starter frameworks.
- `docs/research/framework-decision.md` — current framework decision.
- `docs/architecture/model-routing.md` — provider-neutral model routing design.
- `docs/architecture/initial-architecture.md` — initial system architecture.
- `docs/ui/kimi-consult-brief.md` — future UI design consultation brief.

## Safety Notes

- Do not commit `.env`, auth files, generated credentials, or local service clones.
- Competitor accounts are only for authorized product observation and must not be stored in repository files.
- Competitor UI may inform workflow understanding, but proprietary assets, exact branding, and trade dress should not be copied.
