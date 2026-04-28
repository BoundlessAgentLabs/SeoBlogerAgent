# Open SEO Writing Agent Implementation Plan

## Goal Description

Build an open-source SEO Super Page generation platform that can replace the core value of `seowriting.ai` while improving content depth, article originality, image realism, and developer customizability.

The first milestone is not a full SaaS clone. It is a working MVP that can take a keyword/topic, generate a structured Super Page plan, rewrite article blocks through provider-neutral model adapters, generate realistic article images, and render a publishable SEO page through an open-source Next.js-based web interface.

## Acceptance Criteria

- AC-1: Super Page schema is defined and machine-readable.
  - Positive Tests:
    - A sample keyword can produce a JSON page plan containing hero answer, sections, FAQ, internal links, image slots, metadata, and quality gates.
    - The schema can be rendered into a page without ad hoc parsing.
  - Negative Tests:
    - A plain unstructured article string is rejected as an invalid Super Page.
    - Missing required blocks are reported with actionable validation errors.

- AC-2: Content generation is block-based, not one-shot article generation.
  - Positive Tests:
    - Each section can be rewritten independently through Codex/OpenAI-compatible models, Gemini, DeepSeek, Kimi/Moonshot, or mock adapters using the section intent, source notes, and anti-AI-tone constraints.
    - The generated content contains examples, caveats, and non-repetitive phrasing.
  - Negative Tests:
    - Repetitive generic intros fail the quality gate.
    - Unsupported statistics or fake citations fail review.

- AC-3: Image generation pipeline supports realistic article images.
  - Positive Tests:
    - Each image slot generates a prompt with subject, context, composition, realism constraints, and avoid-list.
    - At least one generated image can be saved with prompt metadata and linked to the article.
  - Negative Tests:
    - An image without alt text, caption, or prompt metadata fails validation.
    - Images with visible text artifacts or irrelevant stock-photo composition are flagged for regeneration.

- AC-4: The web UI supports the core authoring workflow.
  - Positive Tests:
    - A user can enter a topic/keyword, review the generated structure, run block generation, preview images, and view the rendered page.
    - The UI exposes generation state and quality warnings clearly.
  - Negative Tests:
    - The UI must not hide failed QA checks behind a publish-ready state.
    - The UI must not require proprietary competitor assets to function.

- AC-5: SEO rendering basics are implemented.
  - Positive Tests:
    - Rendered pages include title, meta description, canonical URL, Open Graph data, Article/BlogPosting JSON-LD, breadcrumbs, headings, internal links, image alt text, and sitemap compatibility.
    - The page can be statically or server-rendered in a search-friendly way.
  - Negative Tests:
    - Pages with duplicate canonical URLs fail validation.
    - Images without descriptive alt text fail validation.

- AC-6: Framework choice is documented and reproducible.
  - Positive Tests:
    - Top candidates are compared by license, stack, freshness, customization cost, and fit for AI generation workflow.
    - The chosen base can be installed and run locally with documented commands.
  - Negative Tests:
    - A framework with unclear license cannot be selected without explicit justification.
    - A candidate that cannot build locally is rejected or marked as blocked.

## Path Boundaries

### Upper Bound

A complete MVP with Next.js UI, structured Super Page generator, provider-neutral rewrite pipeline with Codex/Gemini/DeepSeek/Kimi support, image generation adapter, QA scoring, preview page, persistent article files, and initial documentation.

### Lower Bound

A documented architecture plus a working CLI or minimal web flow that generates one Super Page JSON, rewrites at least two sections, generates one image, and renders a preview page.

### Allowed Choices

- Can use Next.js, TypeScript, Tailwind, MDX/JSON content files, Codex/OpenAI-compatible models, Gemini, DeepSeek, Kimi/Moonshot, GPT Image tooling, CodexImagen2API, and Kimi consultation.
- Can inspect `seowriting.ai` only with user-provided authorization for product research.
- Can use competitor UI as inspiration for workflow patterns.
- Cannot store credentials in repo files.
- Cannot copy proprietary images, logos, or exact trade dress from competitors.
- Cannot optimize for search spam over helpful user outcomes.

## Dependencies and Sequence

### Milestone 1: Research and Product Definition

- Finalize Super Page block schema.
- Inspect competitor workflow and document UI/product observations without secrets.
- Compare framework candidates and choose base.
- Define image quality rubric.

### Milestone 2: Prototype Foundation

- Scaffold or clone chosen framework.
- Add article content model.
- Add sample Super Page fixture.
- Render sample page with SEO metadata.

### Milestone 3: Content Pipeline

- Implement outline generation adapter.
- Implement provider-neutral block rewrite adapter with `codex5.5pro` as the default local model preference.
- Add anti-AI-tone and factuality review prompts.
- Store generation logs and quality reports.

### Milestone 4: Image Pipeline

- Implement image prompt generator.
- Add adapter for CodexImagen2API / GPT Image path.
- Save generated images with metadata.
- Add image QA checklist and regenerate flow.

### Milestone 5: UI / UX

- Build topic input, page structure editor, section generation status, image gallery, quality report panel, and preview page.
- Run `kimi-consult` against the real UI files for critique.
- Apply UI improvements.

### Milestone 6: Humanize RLCR Execution

- Start Humanize RLCR with this plan.
- Implement in small rounds.
- Write round summaries and let Codex review for completeness and quality.

## Implementation Notes

- Prefer small, composable agents over a single giant prompt.
- Store prompts and outputs for reproducibility.
- Make image generation pluggable because this area will change quickly.
- Treat quality gates as product features, not hidden implementation checks.
- Keep UI independent from competitor branding.
- Do not include account credentials in any committed file.

## Immediate Next Actions

1. Clone and inspect `ixartz/Next-js-Blog-Boilerplate` and `nooqta/ai-content`.
2. Decide base framework.
3. Create `super-page.schema.json` and one sample fixture.
4. Build first page renderer.
5. Run Kimi consultation on the initial UI shell.
