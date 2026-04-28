# Image Quality Rubric

Research date: 2026-04-28

## Goal

Generated article images should reduce the AI feel of SEO pages by being useful, realistic, context-aware, and reviewed as first-class article assets.

## Required Metadata

Every image slot must include:

- Purpose in the article.
- Subject.
- Context.
- Composition.
- Realism constraints.
- Avoid-list.
- Alt text.
- Caption.
- Provider.
- Generation status.
- QA status for relevance, text artifacts, and realism.

## Pass / Warn / Fail Criteria

### Relevance

- Pass: The image directly supports the section's search intent or explains a workflow.
- Warn: The image is broadly related but mostly decorative.
- Fail: The image could fit any generic AI article and does not clarify the topic.

### Text Artifacts

- Pass: No fake readable UI text, warped labels, or accidental watermarks.
- Warn: Minor abstract UI shapes are present but not misleading.
- Fail: Garbled text, fake screenshots, false brand marks, or misleading labels appear.

### Realism

- Pass: Lighting, materials, hands, devices, reflections, and perspective are plausible.
- Warn: Mock/vector placeholder or stylized image is acceptable for testing but must be regenerated for production.
- Fail: Distorted anatomy, impossible objects, plastic textures, or surreal stock-photo composition.

### Article Fit

- Pass: Alt text and caption describe the actual image and connect it to the article.
- Warn: Alt text is descriptive but caption does not add context.
- Fail: Missing alt text, missing caption, or metadata does not match the image.

## Prompt Rules

Strong image prompts should include:

- Concrete subject and environment.
- Intended article use: hero, section illustration, diagram, comparison.
- Camera/composition language when photorealistic.
- Realism constraints.
- Explicit avoid-list.
- Instruction to avoid readable fake UI text unless text is required and can be verified.

## MVP Handling

Round 1 uses deterministic mock SVG assets with real prompt metadata. These are marked `mock` and should be replaced by live GPT Image/CodexImagen2API outputs in a later image pipeline round.
