# Framework Decision

Decision date: 2026-04-28

## Evaluated Candidates

### `ixartz/Next-js-Blog-Boilerplate`

Strengths:

- MIT license.
- Mature blog starter.
- Simple Markdown/SEO layout patterns.

Weaknesses:

- Next.js 12 and React 17 era stack.
- Pages Router rather than modern App Router.
- No built-in AI/content-generation flow.

### `nooqta/ai-content`

Strengths:

- MIT license.
- Next.js 13 App Router.
- TypeScript, Tailwind, Contentlayer, MDX.
- Already has an AI content generation script, even though it is obsolete.
- Conceptually closer to an AI content platform.

Weaknesses:

- Old OpenAI SDK and deprecated `text-davinci-003` script.
- Demo-style article generation rather than production content pipeline.
- Needs significant refactor for provider-neutral model routing and Super Page structure.

## Decision

Use `nooqta/ai-content` as the primary starter reference/base because it is closer to the target product shape: Next.js App Router + MDX/Contentlayer + AI content generation concept.

Do not preserve its old `scripts/generate.js` architecture as-is. Replace it with a provider-neutral model gateway and block-based Super Page pipeline.

## Import Strategy

Recommended import approach:

1. Bring in the app shell, Tailwind setup, Contentlayer setup, and MDX rendering patterns.
2. Replace sample content with Super Page fixtures.
3. Replace deprecated OpenAI completion script with provider adapters.
4. Add project-specific UI for generation, image workflow, and quality report.
5. Keep attribution/license files when code is reused.

## Fallback

If `nooqta/ai-content` fails to build cleanly or introduces too much legacy complexity, fall back to a clean custom Next.js scaffold while using `ixartz/Next-js-Blog-Boilerplate` as an SEO layout reference.
