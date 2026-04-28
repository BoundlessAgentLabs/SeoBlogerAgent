import type { SuperPage } from "@/super-page/types";

function absoluteUrl(value: string, baseUrl: string) {
  return new URL(value, baseUrl).toString();
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function articleJsonLd(page: SuperPage) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: page.metadata.title,
    description: page.metadata.description,
    dateModified: page.metadata.updatedAt,
    author: {
      "@type": "Organization",
      name: page.metadata.author,
    },
    image: page.imageSlots.map((image) => absoluteUrl(image.assetPath ?? page.metadata.openGraph.image, page.metadata.canonicalUrl)),
    mainEntityOfPage: page.metadata.canonicalUrl,
  };
}

export function breadcrumbJsonLd(page: SuperPage) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: page.breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href, page.metadata.canonicalUrl),
    })),
  };
}
