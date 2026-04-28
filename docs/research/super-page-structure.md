# SEO-Friendly Super Page Structure Research

Research date: 2026-04-28

## Working Definition

A Super Page is a long-form, modular SEO article designed to satisfy a broad search intent and multiple related sub-intents on one page. It should be more than a long blog post: it needs a deliberate information architecture, strong internal navigation, rich media, schema metadata, and quality gates that ensure the page is useful to humans rather than just keyword-dense.

## Source-Grounded Principles

### People-first content is the baseline

Google's helpful content guidance emphasizes original information, complete topic coverage, insight beyond the obvious, trust signals, first-hand expertise, and a satisfying reader outcome. It explicitly warns against producing content primarily to attract search traffic, mass-producing broad-topic content, or summarizing others without adding value.

Source: https://developers.google.com/search/docs/fundamentals/creating-helpful-content

### AI is allowed, but quality and intent decide risk

Google's AI content guidance says the issue is not whether content is AI-generated, but whether it is original, high-quality, people-first, and demonstrates E-E-A-T. AI automation used primarily to manipulate rankings is spam; AI used to help create useful content can be acceptable.

Source: https://developers.google.com/search/blog/2023/02/google-search-and-ai-content

### Site structure and discoverability matter

Google recommends logical site organization, descriptive URLs, grouping topically similar pages, reducing duplicate content, making content useful, adding images with descriptive alt text, and using links to connect users and crawlers to relevant pages.

Source: https://developers.google.com/search/docs/fundamentals/seo-starter-guide

### Internal links need meaningful anchors

Anchor text should be descriptive, concise, and relevant to both the current page and the linked page. This supports both navigation and search understanding.

Source: https://developers.google.com/search/docs/crawling-indexing/links-crawlable

### Blog/article schema should be generated

Article, NewsArticle, or BlogPosting structured data can help Google understand article pages. Recommended properties should be populated where applicable, including headline, images, dates, and author information.

Source: https://developers.google.com/search/docs/appearance/structured-data/article

## Proposed Super Page Block Schema

### 1. SERP Intent Brief

Stored internally, not necessarily displayed.

- Primary keyword.
- Search intent: informational, commercial, transactional, navigational, mixed.
- Reader profile.
- Pain points.
- Content promise.
- Differentiation angle.
- Competitor gaps.

### 2. Above-the-Fold Answer Block

Visible near the top.

- H1 with clear user benefit.
- 2-4 sentence direct answer.
- Optional summary bullets.
- Trust cue: reviewed by, updated date, source count, or experience note.
- Hero image only if it helps the topic.

### 3. Table of Contents

- Sticky or collapsible on desktop.
- Jump links to H2 sections.
- Useful anchor text, not generic labels.

### 4. Deep Section Blocks

Each major H2 section should be generated from a block contract:

- Search sub-intent.
- Summary claim.
- Explanation.
- Specific example.
- Caveat or limitation.
- Optional image/table/callout.
- Internal link opportunity.
- External source requirement if factual.

### 5. Comparison / Decision Blocks

Useful for commercial and product-led pages.

- Comparison table.
- Pros and cons.
- Best-for labels.
- Use-case matching.
- Decision checklist.

### 6. Visual Blocks

Images should be generated for comprehension, not decoration.

- One hero image or diagram.
- Section-level images only when they clarify concepts.
- Prompt should include context, realism constraints, brand style, and what to avoid.
- Every image needs alt text and caption.
- Avoid fake screenshots unless generated UI is explicitly part of the article.

### 7. FAQ Block

- Questions from real search intent and likely objections.
- Answers should be short, accurate, and non-repetitive.
- FAQ should not duplicate the article body word-for-word.

### 8. Trust / E-E-A-T Block

- Author or reviewer information.
- Update history.
- Methodology note for generated or assisted content if appropriate.
- Citations or source links.
- Disclaimers for YMYL topics.

### 9. Internal Link Graph

- Related articles.
- Parent topic hub.
- Child deep dives.
- Conversion page, if relevant.
- Anchor text generated from the destination page purpose.

### 10. SEO Metadata and Structured Data

- Title tag.
- Meta description.
- Canonical URL.
- Open Graph/Twitter metadata.
- Article/BlogPosting JSON-LD.
- Breadcrumb JSON-LD.
- Image metadata and alt text.

## Anti-AI-Taste Quality Gates

A page should fail review if it contains:

- Generic introductions like "In today's digital age".
- Repeated section openings with the same rhythm.
- Unsupported claims or fake statistics.
- Excessive keyword repetition.
- Bland summaries without examples.
- AI-looking images that do not match article specifics.
- Overly symmetrical stock-photo compositions.
- Repetitive "unlock, leverage, streamline, revolutionize" phrasing.

## MVP Super Page Template

1. `ArticleBrief`
2. `HeroAnswer`
3. `TOC`
4. `Section[]`
5. `ComparisonTable?`
6. `ImageBlock[]`
7. `FAQ[]`
8. `InternalLinks`
9. `ArticleSchema`
10. `QualityReport`

## Product Implication

The product should not simply ask an LLM for "an SEO article". It should generate a structured page plan first, then create and review each block independently.
