# Competitor Workflow Observations

Date: 2026-04-28

## Scope and Safety

The project owner provided authorization to inspect `seowriting.ai`, but this round did not perform a logged-in browser session because credential-safe browser handling should be isolated from implementation work. No credentials, screenshots, proprietary assets, logos, or trade dress are stored here.

## Non-Secret Workflow Assumptions Used For MVP

These observations are intentionally generic and based on the product goal plus common SEO-writing workflows, not copied private UI assets:

1. Users need a topic/keyword input as the starting point.
2. Users need to inspect the generated page structure before accepting content.
3. Section-by-section generation status is important because weak blocks should be retried independently.
4. Image generation needs visible prompt metadata, QA status, and regeneration state.
5. A quality report should block false publish-ready states when content, image, or SEO checks fail.
6. The preview should remain separate from editing controls so users can judge the final page structure.

## Impact On UI

The Round 2 workflow UI implements these safe workflow patterns without using competitor branding or visual assets:

- Editable topic input.
- Generate structure action.
- Generate blocks action.
- Image prompt preparation action.
- Visible event log.
- Quality report and publish-readiness state.
- Link to rendered preview.

## Follow-Up

A dedicated research round may perform authorized logged-in observation and add non-secret workflow notes, but it must not store credentials, screenshots, proprietary copy, logos, or exact trade dress.
