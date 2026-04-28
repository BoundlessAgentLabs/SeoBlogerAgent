import type { ImageSlot, SuperPage } from "@/super-page/types";

export interface ImageReadinessResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function hasPromptMetadata(slot: ImageSlot) {
  return Boolean(
    slot.prompt?.subject?.trim() &&
    slot.prompt?.context?.trim() &&
    slot.prompt?.composition?.trim() &&
    slot.prompt?.realismConstraints?.length > 0 &&
    slot.prompt?.avoid?.length > 0,
  );
}

function looksLikeStockComposition(slot: ImageSlot) {
  const combined = `${slot.prompt?.subject ?? ""} ${slot.prompt?.context ?? ""} ${slot.prompt?.composition ?? ""}`.toLowerCase();
  return /stock photo|generic business people|smiling team|handshake|corporate stock|floating charts/.test(combined);
}

export function validateImageReadiness(page: SuperPage): ImageReadinessResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const slot of page.imageSlots) {
    const path = `/${page.slug}/imageSlots/${slot.id}`;
    if (slot.alt.trim().length < 18) errors.push(`${path}/alt must be descriptive`);
    if (slot.caption.trim().length < 18) errors.push(`${path}/caption must be descriptive`);
    if (!hasPromptMetadata(slot)) errors.push(`${path}/prompt metadata is incomplete`);
    if (slot.qa.relevance === "fail") errors.push(`${path}/qa relevance failed and requires regeneration`);
    if (slot.qa.textArtifacts === "fail") errors.push(`${path}/qa textArtifacts failed and requires regeneration`);
    if (slot.qa.realism === "fail") errors.push(`${path}/qa realism failed and requires regeneration`);
    if (slot.qa.realism === "warn") warnings.push(`${path}/qa realism needs generated-image review`);
    if (looksLikeStockComposition(slot)) errors.push(`${path}/prompt composition looks like generic stock-photo imagery and requires regeneration`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
