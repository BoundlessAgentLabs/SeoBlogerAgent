# Open SEO Writing Agent Draft

## Background

The project owner is the developer of `seowriting` and wants to open-source a stronger alternative to `seowriting.ai`.

The target product should preserve the useful high-level output structure of `seowriting.ai` Super Pages while improving the two areas that currently limit quality:

1. Article depth and originality.
2. Image realism and relevance.

This repository is for learning, research, and open-source experimentation. Any competitor analysis should be used for product understanding and interoperability, not for copying private assets, branding, or proprietary implementation details.

## Product Goal

Build an open-source SEO content platform that can generate a high-quality, publish-ready Super Page from a topic or keyword cluster.

The system should feel like a better, developer-friendly alternative to `seowriting.ai`:

- Stronger article structure.
- Less obvious AI writing style.
- Better factual density and topical coverage.
- More realistic, useful, on-topic images.
- Transparent workflow that developers can inspect, customize, and self-host.

## Core Hypothesis

`seowriting.ai` appears valuable because it packages SEO content into a repeatable Super Page structure. The opportunity is not merely to generate more words, but to improve each stage of the production pipeline:

1. Keep the SEO-friendly Super Page skeleton.
2. Rewrite and enrich each section with Gemini.
3. Generate images with GPT Image 2.0 / GPT Image tooling instead of low-fidelity image models.
4. Add quality gates that reduce generic AI tone before publishing.
5. Provide an open-source web UI that is easier to trust, inspect, and extend.

## Initial Requirements

### Super Page Structure

- Identify what makes a Super Page SEO-friendly.
- Define reusable page blocks: title, intro, table of contents, answer box, comparison tables, FAQ, buying guide, image blocks, citations, internal links, conclusion, schema metadata.
- Preserve structure but avoid copying exact proprietary templates or visual assets.

### Content Pipeline

- Use Gemini to rewrite each paragraph or block.
- Require deeper content than a normal AI article: concrete examples, nuanced explanations, original comparisons, limitations, expert notes, and citations where appropriate.
- Avoid mechanical SEO stuffing.
- Add quality review passes for factuality, repetition, AI tone, search intent fit, and missing subtopics.

### Image Pipeline

- Use GPT Image 2.0 / GPT Image-style image generation pipeline.
- Generate realistic, context-aware article images.
- Reduce common AI image artifacts: distorted hands, fake UI, unreadable text, impossible objects, plastic textures, and generic stock-photo composition.
- Support prompt iteration because image quality is expected to require token-heavy experimentation.

### UI / UX

- Study `seowriting.ai` with the provided account only for authorized visual and workflow reference.
- Use `kimi-consult` for UI design critique and redesign direction once a base framework or prototype exists.
- The UI may be inspired by competitor workflows but should become its own open-source product identity.

### Framework Selection

- Find a practical open-source SEO/blog/agent website framework.
- Prefer a framework that is easy to self-host, modern, SEO-friendly, and compatible with a content-generation workflow.
- Candidate stack likely includes Next.js, TypeScript, MDX or database-backed content, Tailwind CSS, and an agent/job queue layer.

## Known Risks

- Directly copying competitor UI/assets could create legal and trust issues.
- AI-generated SEO content can become search-engine-first spam if quality gates are weak.
- Image generation quality may require expensive iteration.
- A monolithic AI writer may be harder to maintain than a composable content pipeline.
- Picking a weak starter framework can slow down the project more than starting from a clean Next.js base.

## Open Questions

1. What exact Super Page block schema should be used for MVP?
2. Which open-source starter should be the base: blog starter, pSEO template, CMS starter, or custom app shell?
3. Should generated content be file-based MDX, database records, or both?
4. Which Gemini model and prompt protocol should be used for paragraph rewriting?
5. Which image generation path should be treated as primary: local CodexImagen2API, built-in Codex `imagegen`, or direct Images API fallback?
6. What quality score is sufficient before a generated article is considered publish-ready?
7. Should the first release focus on single-article generation or topic-cluster/site generation?

## Humanize Workflow Intent

Use Humanize in phases:

1. Draft this idea into a structured plan.
2. Refine acceptance criteria and implementation boundaries.
3. Use Kimi consultation for UI design once real UI files exist.
4. Execute implementation with RLCR review loops.
