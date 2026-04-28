export type QualityStatus = "pass" | "warn" | "fail";

export interface SuperPage {
  schemaVersion: "1.0.0";
  slug: string;
  brief: {
    keyword: string;
    intent: "informational" | "commercial" | "transactional" | "navigational" | "mixed";
    audience: string;
    angle: string;
    sourceModel: string;
  };
  metadata: {
    title: string;
    description: string;
    canonicalUrl: string;
    updatedAt: string;
    author: string;
    openGraph: {
      title: string;
      description: string;
      image: string;
    };
  };
  hero: {
    headline: string;
    answer: string;
    summaryBullets: string[];
    trustCue: string;
  };
  toc: Array<{ id: string; label: string }>;
  sections: Array<{
    id: string;
    heading: string;
    searchIntent: string;
    summaryClaim: string;
    paragraphs: string[];
    examples: string[];
    caveats: string[];
    sourceNotes: Array<{
      label: string;
      note: string;
      sourceType: "research" | "experience" | "competitor-observation" | "assumption" | "internal";
    }>;
    generationConstraints: {
      mustInclude: string[];
      avoidPhrases: string[];
      claimPolicy: string;
      citationPolicy: string;
    };
    imageSlotId: string;
    qualityNotes: string[];
  }>;
  faq: Array<{ question: string; answer: string }>;
  internalLinks: Array<{ anchor: string; href: string; purpose: string }>;
  imageSlots: ImageSlot[];
  breadcrumbs: Array<{ name: string; href: string }>;
  qualityGates: Array<{
    id: string;
    label: string;
    status: QualityStatus;
    severity: "low" | "medium" | "high";
    evidence: string;
  }>;
}

export interface ImageSlot {
  id: string;
  kind: "hero" | "section" | "diagram" | "comparison";
  purpose: string;
  prompt: {
    subject: string;
    context: string;
    composition: string;
    realismConstraints: string[];
    avoid: string[];
  };
  alt: string;
  caption: string;
  provider: string;
  status: "planned" | "generated" | "needs-regeneration" | "mock";
  assetPath?: string;
  qa: {
    relevance: QualityStatus;
    textArtifacts: QualityStatus;
    realism: QualityStatus;
    notes: string;
  };
}
