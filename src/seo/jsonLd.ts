import type { SuperPage } from "@/super-page/types";

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
    image: page.imageSlots.map((image) => image.assetPath ?? page.metadata.openGraph.image),
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
      item: item.href,
    })),
  };
}
