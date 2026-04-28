# Framework Validation Log

Validation date: 2026-04-28

## Environment

```text
node: v25.9.0
npm: 11.12.1
```

## Candidate: `nooqta/ai-content`

Repository: https://github.com/nooqta/ai-content

Commands run in `/tmp/seo-framework-candidates/nooqta-ai-content`:

```bash
git clone --depth 1 https://github.com/nooqta/ai-content.git nooqta-ai-content
npm install
npm run build
```

Result:

- `npm install` completed successfully.
- `npm run build` completed successfully.
- Build produced warnings from Contentlayer about 3 invalid MDX documents:
  - `posts/python-exception-handling.mdx`
  - `posts/python-file-io.mdx`
  - `posts/python-object-oriented-programming.mdx`
- The app still compiled, checked types, collected page data, and generated static pages.

Decision impact:

- The App Router + Tailwind + MDX/content concept is viable.
- The old AI script is not suitable as a production base because it uses deprecated `text-davinci-003`, OpenAI SDK 3.x, and one-shot article generation.
- This project therefore uses a clean Next.js App Router scaffold while preserving the validated architectural direction: structured content files, Tailwind UI, static preview pages, and replaceable generation scripts.

## Candidate: `ixartz/Next-js-Blog-Boilerplate`

Repository: https://github.com/ixartz/Next-js-Blog-Boilerplate

Observed package metadata:

- Next.js `^12.0.10`
- React `^17.0.2`
- MIT license
- Mature blog starter but older Pages Router stack.

Decision impact:

- Useful SEO/blog layout reference.
- Not selected as the primary scaffold because the target product needs modern App Router workflows and generation-oriented app screens.

## Repository Scaffold Decision

The committed scaffold is a clean Next.js App Router + TypeScript + Tailwind project with executable validation scripts:

```bash
npm install
npm run validate:content
npm run generate:mock
npm run build
```

This avoids copying competitor assets or legacy generator code while retaining the validated framework direction.
