# Open-Source Framework Candidates

Research date: 2026-04-28

## Selection Criteria

- Open-source and self-hostable.
- Good fit for SEO pages and blog publishing.
- Modern frontend stack, preferably Next.js + TypeScript.
- Easy to customize UI and content pipeline.
- Supports static or hybrid rendering for search performance.
- Can integrate Gemini rewriting, GPT Image pipeline, queues, and quality review.
- Active enough to avoid starting on abandoned code.

## Candidate Shortlist

### 1. `ixartz/Next-js-Blog-Boilerplate`

- URL: https://github.com/ixartz/Next-js-Blog-Boilerplate
- Stars checked: 689
- Updated: 2026-04-21
- License: MIT
- Stack: Next.js, TypeScript, Tailwind, MDX-style blog starter
- Fit: Strong baseline if we want a clean SEO blog frontend and own the agent/backend ourselves.
- Risk: Uses older Next.js lineage per repo description; may require modernization if we want latest App Router conventions.
- Verdict: Best conservative starting point for blog publishing UI.

### 2. `agamm/pseo-next`

- URL: https://github.com/agamm/pseo-next
- Stars checked: 59
- Updated: 2026-04-04
- License: not detected by GitHub API
- Stack: Next 13 Programmatic SEO template
- Fit: Useful reference for scalable page generation and route/data patterns.
- Risk: Smaller project; license needs manual verification before basing an open-source product on it.
- Verdict: Good pSEO reference, not yet ideal as primary base.

### 3. `makerkit/next-blog-kit`

- URL: https://github.com/makerkit/next-blog-kit
- Stars checked: 66
- Updated: 2026-02-14
- License: not detected by GitHub API
- Stack: Next.js, MDX, Tailwind CSS
- Fit: Simple blog starter; likely easy to inspect and adapt.
- Risk: License unclear from GitHub API; may be tied to Makerkit ecosystem assumptions.
- Verdict: Candidate if license is acceptable and code is clean.

### 4. `nooqta/ai-content`

- URL: https://github.com/nooqta/ai-content
- Stars checked: 63
- Updated: 2026-04-10
- License: MIT
- Stack: Next.js, Contentlayer, Tailwind, MDX, TypeScript
- Fit: Closest conceptually because it is already an AI-powered content generator starter.
- Risk: Need to inspect architecture quality; may be demo-oriented rather than production-ready.
- Verdict: Strong candidate for prototype inspiration.

### 5. `Blazity/next-news`

- URL: https://github.com/Blazity/next-news
- Stars checked: 75
- Updated: 2026-02-13
- License: MIT
- Stack: TypeScript news/blog style frontend
- Fit: Useful if we want editorial/news layout patterns.
- Risk: Description sparse; needs code inspection.
- Verdict: Secondary UI/layout reference.

## Initial Recommendation

Do not start from a full AI writer clone. Start from a clean SEO-friendly Next.js blog foundation, then build the AI generation pipeline as first-class application logic.

Recommended path:

1. Inspect `ixartz/Next-js-Blog-Boilerplate` and `nooqta/ai-content` locally.
2. Choose one of these as the first prototype base.
3. Add a structured content model for Super Pages.
4. Add generation jobs separately from rendering.
5. Use `kimi-consult` after the first UI shell exists.

## Architecture Direction

### Frontend

- Next.js + TypeScript.
- Tailwind CSS.
- SEO metadata generation.
- Article preview and editor UI.
- Generated image gallery with prompt/version history.

### Content Storage

MVP can start with file-backed MDX/JSON for transparency:

- `content/articles/<slug>/article.json`
- `content/articles/<slug>/index.mdx`
- `content/articles/<slug>/images/*.png`
- `content/articles/<slug>/quality-report.json`

Later versions can add database storage.

### AI Pipeline

- Outline agent: generates Super Page schema.
- Research agent: gathers sources and topic gaps.
- Gemini rewrite agent: rewrites each paragraph/block.
- Image prompt agent: creates image prompts and negative constraints.
- Image generation adapter: GPT Image 2.0 / CodexImagen2API / built-in imagegen fallback.
- QA agent: checks factuality, AI tone, SEO completeness, image relevance.

## Next Research Tasks

- Clone and inspect top 2 candidates.
- Verify licenses manually.
- Check build commands and dependency freshness.
- Decide whether the repository should become a fork of a starter or a new app that borrows patterns.
