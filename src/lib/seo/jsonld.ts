import type { SiteConfig } from "../../content/site";

// JSON-LD graph builders. Every node carries a stable `@id` so nodes reference
// each other instead of being duplicated, and the whole page emits a single
// `@graph`. Keep schema values consistent with what is actually visible on the
// page. (§3 構造化データ / 設定の集約)

type Node = Record<string, unknown>;

/**
 * The two fields a BreadcrumbList entry needs.
 *
 * Structurally identical to `BreadcrumbItem` in Breadcrumbs.astro, and
 * deliberately not imported from it: this module builds structured data and
 * must not depend on whether the site renders a visible trail (or on any
 * component at all). Two fields are cheap to restate; a dependency between
 * these layers is not.
 */
type BreadcrumbInput = { name: string; url: string };

export type ArticleInput = {
  headline: string;
  description?: string;
  image?: string; // absolute URL
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
};

const origin = (url: string) => new URL(url).origin;
const abs = (path: string, base: string) => new URL(path, base).toString();

const ids = (base: string) => ({
  organization: `${origin(base)}/#organization`,
  website: `${origin(base)}/#website`,
  logo: `${origin(base)}/#logo`,
  person: `${origin(base)}/#person`,
  localBusiness: `${origin(base)}/#localbusiness`,
  webPage: (canonical: string) => `${canonical}#webpage`,
  article: (canonical: string) => `${canonical}#article`,
  breadcrumb: (canonical: string) => `${canonical}#breadcrumb`,
});

export function organizationNode(site: SiteConfig, base: string): Node {
  const id = ids(base);
  const logo = site.seo.logo ? abs(site.seo.logo, base) : undefined;
  return {
    "@type": "Organization",
    "@id": id.organization,
    name: site.name,
    url: `${origin(base)}/`,
    ...(logo && {
      logo: {
        "@type": "ImageObject",
        "@id": id.logo,
        url: logo,
        caption: site.name,
      },
      image: { "@id": id.logo },
    }),
    ...(site.sameAs?.length ? { sameAs: site.sameAs } : {}),
  };
}

export function webSiteNode(site: SiteConfig, base: string): Node {
  const id = ids(base);
  return {
    "@type": "WebSite",
    "@id": id.website,
    name: site.name,
    url: `${origin(base)}/`,
    inLanguage: site.locale,
    publisher: { "@id": id.organization },
  };
}

export function personNode(site: SiteConfig, base: string): Node {
  const id = ids(base);
  const sameAs = Object.values(site.author.socials ?? {}).filter(
    Boolean,
  ) as string[];
  return {
    "@type": "Person",
    "@id": id.person,
    name: site.author.name,
    ...(site.author.url && { url: site.author.url }),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function webPageNode(opts: {
  site: SiteConfig;
  base: string;
  canonical: string;
  title: string;
  description: string;
  hasBreadcrumb?: boolean;
}): Node {
  const { site, base, canonical, title, description, hasBreadcrumb } = opts;
  const id = ids(base);
  return {
    "@type": "WebPage",
    "@id": id.webPage(canonical),
    url: canonical,
    name: title,
    description,
    inLanguage: site.locale,
    isPartOf: { "@id": id.website },
    ...(hasBreadcrumb && { breadcrumb: { "@id": id.breadcrumb(canonical) } }),
  };
}

export function articleNode(opts: {
  site: SiteConfig;
  base: string;
  canonical: string;
  article: ArticleInput;
}): Node {
  const { site, base, canonical, article } = opts;
  const id = ids(base);
  return {
    "@type": "Article",
    "@id": id.article(canonical),
    headline: article.headline,
    ...(article.description && { description: article.description }),
    ...(article.image && { image: article.image }),
    ...(article.datePublished && { datePublished: article.datePublished }),
    ...(article.dateModified && { dateModified: article.dateModified }),
    inLanguage: site.locale,
    mainEntityOfPage: { "@id": id.webPage(canonical) },
    // Per-post byline wins over the site author; keep it in sync with what
    // the page visibly shows.
    author:
      article.authorName && article.authorName !== site.author.name
        ? { "@type": "Person", name: article.authorName }
        : { "@id": id.person },
    publisher: { "@id": id.organization },
  };
}

export function breadcrumbNode(
  items: BreadcrumbInput[],
  canonical: string,
): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function localBusinessNode(site: SiteConfig, base: string): Node | null {
  const b = site.business;
  if (!b) return null;
  const id = ids(base);
  const logo = site.seo.logo ? abs(site.seo.logo, base) : undefined;
  return {
    "@type": b.type ?? "LocalBusiness",
    "@id": id.localBusiness,
    name: b.legalName ?? site.name,
    url: `${origin(base)}/`,
    ...(logo && { image: logo }),
    ...(b.telephone && { telephone: b.telephone }),
    ...(b.email && { email: b.email }),
    ...(b.priceRange && { priceRange: b.priceRange }),
    ...(b.address && {
      address: { "@type": "PostalAddress", ...b.address },
    }),
    ...(b.geo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: b.geo.latitude,
        longitude: b.geo.longitude,
      },
    }),
    ...(b.hasMap && { hasMap: b.hasMap }),
    ...(b.areaServed?.length ? { areaServed: b.areaServed } : {}),
    ...(b.openingHours?.length ? { openingHours: b.openingHours } : {}),
    ...(site.sameAs?.length ? { sameAs: site.sameAs } : {}),
  };
}

/**
 * Compose the full page graph: base nodes (Organization, WebSite, Person,
 * optional LocalBusiness) plus the current WebPage and any page-specific
 * Article / BreadcrumbList nodes. Returns a single `@graph` object.
 */
export function siteGraph(opts: {
  site: SiteConfig;
  base: string;
  canonical: string;
  title: string;
  description: string;
  isArticle?: boolean;
  article?: ArticleInput;
  breadcrumbs?: BreadcrumbInput[];
  extra?: Node[];
}): Node {
  const {
    site,
    base,
    canonical,
    title,
    description,
    isArticle,
    article,
    breadcrumbs,
    extra,
  } = opts;

  const graph: Node[] = [organizationNode(site, base), webSiteNode(site, base)];
  if (site.author?.name) graph.push(personNode(site, base));

  const business = localBusinessNode(site, base);
  if (business) graph.push(business);

  graph.push(
    webPageNode({
      site,
      base,
      canonical,
      title,
      description,
      hasBreadcrumb: !!breadcrumbs?.length,
    }),
  );

  if (breadcrumbs?.length) graph.push(breadcrumbNode(breadcrumbs, canonical));
  if (isArticle && article)
    graph.push(articleNode({ site, base, canonical, article }));
  if (extra?.length) graph.push(...extra);

  return { "@context": "https://schema.org", "@graph": graph };
}
