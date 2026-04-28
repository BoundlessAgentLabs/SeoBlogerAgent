# Kimi Consult Brief Template

Use this after a real UI shell exists. The current machine already has the `kimi-consult` skill installed.

## When To Run

Run Kimi after one of these exists:

- A cloned starter framework with homepage/editor files.
- A first custom Next.js UI shell.
- Screenshots or notes from authorized `seowriting.ai` product observation.

## Intended Kimi Mode

Use `ui-design` because this is primarily about product UI, visual hierarchy, workflow clarity, and reducing generic SaaS feel.

## Draft Prompt

```text
We are building an open-source alternative to seowriting.ai for SEO Super Page generation.

Target users: SEO operators, affiliate site builders, content teams, and developers who want a self-hostable AI writing workflow.

Product goal: preserve the useful Super Page workflow while making content quality review, image generation, and prompt/version transparency much stronger.

Current UI problems to solve:
- AI writing tools often feel generic and untrustworthy.
- Users need to understand article structure, generation state, image quality, and SEO checks at a glance.
- The product should feel open-source, inspectable, and professional, not like a closed black-box SaaS.

Please critique the current files and propose concrete UI direction for:
1. Topic input and project creation.
2. Super Page structure editor.
3. Section-by-section generation progress.
4. Image prompt/version gallery.
5. Quality report and publish readiness.
6. Preview/publish workflow.

Give implementation-oriented guidance for layout, typography, spacing, component hierarchy, empty states, and mobile behavior.
```

## Example Command

```bash
node "${CODEX_HOME:-$HOME/.codex}/bin/kimi-consult.mjs" \
  --mode ui-design \
  --context apps/web/app/page.tsx \
  --context apps/web/app/globals.css \
  --context docs/research/super-page-structure.md \
  "<paste the brief above>"
```

## Notes

- Do not ask Kimi to copy competitor branding.
- Ask for concrete implementation advice, not generic inspiration.
- Keep context to 2-6 relevant files.
