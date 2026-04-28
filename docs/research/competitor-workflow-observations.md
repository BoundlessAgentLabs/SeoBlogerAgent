# Competitor Workflow Observations

Date: 2026-04-28

## Scope and Safety

The project owner authorized competitor workflow observation. This round used Playwright to inspect public `seowriting.ai` and public help-center pages only. The logged-in product session was not automated because entering the owner-provided password through shell or Playwright commands would expose it in tool logs. No credentials, cookies, screenshots, proprietary images, logos, exact copy blocks, or trade dress are stored in this repository.

Observed public URLs:

- `https://seowriting.ai/`
- `https://seowriting.ai/login`
- `https://docs.seowriting.ai/`
- `https://docs.seowriting.ai/search?q=super%20page`
- `https://docs.seowriting.ai/article/super-page`

## Observed Non-Secret Workflow Facts

These notes are paraphrased workflow facts from public pages and help docs, not copied private UI assets:

1. The product presents Super Page as a page-creation agent rather than a one-shot article writer.
2. The public positioning says the workflow analyzes search competitors and uses CTA/page-structure signals when creating pages.
3. Super Page is reachable from the dashboard and is also exposed from other product pages, implying it is a first-class workflow entry point.
4. The creation flow starts from free-form instructions rather than only a single keyword field.
5. The documented instruction inputs include keyword/topic, what is being sold or promoted, and desired user action/CTA.
6. Example use cases include comparison pages, local service pages, reference-URL articles, listicles, and guides with product recommendations.
7. The workflow includes target-location selection so SERP/page generation can be localized.
8. The workflow includes brand-voice selection for tone/style control.
9. The workflow includes an AI image model choice, and the help docs mention credit cost differences for image model selection.
10. The documented final action is a start/create step, followed by a generated Super Page after a waiting period.
11. The publish flow includes one-click WordPress publishing.
12. Help/support entry points remain visible via chat/email, suggesting long-running generation and publishing failures need visible recovery paths.

## Local Product Requirements Reconciled

Round 4 reconciled the safe workflow facts without copying competitor branding or exact UI:

- Added optional persisted workflow inputs for desired action/CTA, target location, brand voice, and image model preference in `src/components/AuthoringWorkflow.tsx`.
- Passed those inputs into the persisted project generator so they affect the generated article angle, source notes, hero answer, and image prompt context.
- Kept the local implementation visually independent: strict developer-tool panels, audit trail, schema/quality evidence, and no competitor assets.
- Preserved the existing open-source differentiator: generated sections, prompt metadata, SEO/image QA, and preview links are stored as local files and inspectable in git.

## Credential-Safe Blocker

A logged-in browser workflow was not completed in this round because the only available credentials were present in chat history. Using them directly in Playwright commands, shell arguments, environment assignments, or temporary scripts would risk exposing secrets in command logs or local files. A future manual observation can complete the private-product portion if the owner logs in directly in a browser session and then asks the agent to inspect only non-secret UI state.

## Boundaries To Preserve

- Do not store credentials, cookies, browser storage, screenshots, or recordings.
- Do not copy proprietary copy, generated examples, logos, screenshots, or visual trade dress.
- Do not reproduce private pricing, account details, user content, or internal dashboard data.
- Use competitor workflow only as generic product research: step sequence, decision points, quality controls, image controls, export/publish flow, and recovery affordances.
