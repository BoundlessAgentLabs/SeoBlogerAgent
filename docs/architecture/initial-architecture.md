# Initial Architecture Sketch

## System Modules

### Web App

- Next.js frontend.
- Article creation flow.
- Super Page editor.
- Rendered page preview.
- Image prompt/version gallery.
- Quality report panel.

### Content Model

- `ArticleBrief`: keyword, audience, intent, angle.
- `SuperPagePlan`: ordered page blocks.
- `SectionBlock`: intent, heading, claims, content, examples, caveats.
- `ImageBlock`: prompt, negative constraints, generated files, alt text, caption.
- `QualityReport`: content, SEO, factuality, image, and publish-readiness checks.

### Generation Services

- Outline planner.
- Gemini section rewriter.
- Source/research collector.
- Image prompt builder.
- GPT Image adapter.
- QA reviewer.

### Persistence

MVP starts file-backed for transparency:

```text
content/articles/<slug>/article.json
content/articles/<slug>/index.mdx
content/articles/<slug>/images/*.png
content/articles/<slug>/quality-report.json
```

Database can be added after the workflow stabilizes.

## Image Generation Adapter Priority

1. Local `CodexImagen2API` for current experiments.
2. Codex `imagegen` skill for built-in Codex image workflows.
3. Direct GPT Image API fallback if explicit API-key path is chosen.

## Humanize Execution Plan

Start RLCR only after the base framework decision is made:

```bash
"/Users/gs2ygc/.codex/skills/humanize/scripts/setup-rlcr-loop.sh" docs/plan.md
```

Use small rounds:

1. Schema and fixture.
2. Renderer.
3. Gemini adapter stub.
4. Image adapter.
5. Quality report.
6. UI pass with Kimi consult.
