import { describe, expect, it } from "vitest";
import type { SiteConfig } from "../../content/site";
import { siteGraph } from "./jsonld";

// The JSON-LD graph is the one part of the SEO layer that is invisible in the
// rendered page but breaks silently when a node stops referencing another.
// These specs pin the wiring, not the wording.

const base = "https://example.com/";

const testSite: SiteConfig = {
  url: "https://example.com",
  name: "Test Site",
  tagline: "tagline",
  description: "description",
  locale: "ja",
  ogLocale: "ja_JP",
  sameAs: ["https://x.com/test"],
  author: {
    name: "Author",
    url: "https://example.com/author",
    socials: { x: "https://x.com/author" },
  },
  nav: [],
  seo: {
    logo: "/icon-512.png",
    robots: "index,follow",
    themeColor: "#fff",
    noindexPaths: [],
  },
};

const graphOf = (result: Record<string, unknown>) =>
  result["@graph"] as Record<string, any>[];
const nodeOf = (result: Record<string, unknown>, type: string) =>
  graphOf(result).find((n) => n["@type"] === type);

describe("siteGraph", () => {
  const canonical = "https://example.com/blog/post";

  it("emits a single @graph under one @context", () => {
    const result = siteGraph({
      site: testSite,
      base,
      canonical,
      title: "Post",
      description: "desc",
    });
    expect(result["@context"]).toBe("https://schema.org");
    expect(Array.isArray(result["@graph"])).toBe(true);
  });

  it("gives every node a unique @id", () => {
    const graph = graphOf(
      siteGraph({
        site: testSite,
        base,
        canonical,
        title: "Post",
        description: "desc",
        isArticle: true,
        article: { headline: "Post" },
        breadcrumbs: [{ name: "Home", url: base }],
      }),
    );
    const idList = graph.map((n) => n["@id"]);
    expect(idList).toHaveLength(new Set(idList).size);
    expect(idList.every(Boolean)).toBe(true);
  });

  it("resolves every @id reference to a node in the same graph", () => {
    const graph = graphOf(
      siteGraph({
        site: testSite,
        base,
        canonical,
        title: "Post",
        description: "desc",
        isArticle: true,
        article: { headline: "Post" },
        breadcrumbs: [{ name: "Home", url: base }],
      }),
    );
    // An object carrying an @id plus other keys DEFINES that node (top-level
    // or nested — both are valid JSON-LD). An object whose only key is @id is
    // a REFERENCE, and must point at something the same page defines.
    const defined = new Set<string>();
    const references: string[] = [];
    const walk = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(walk);
      if (!value || typeof value !== "object") return;
      const entries = Object.entries(value as Record<string, unknown>);
      const id = (value as Record<string, unknown>)["@id"];
      if (typeof id === "string") {
        if (entries.length === 1) {
          references.push(id);
          return;
        }
        defined.add(id);
      }
      entries.forEach(([key, child]) => key !== "@id" && walk(child));
    };
    graph.forEach(walk);

    expect(references.length).toBeGreaterThan(0);
    for (const ref of references) expect(defined).toContain(ref);
  });

  it("links Article -> WebPage -> WebSite -> Organization", () => {
    const result = siteGraph({
      site: testSite,
      base,
      canonical,
      title: "Post",
      description: "desc",
      isArticle: true,
      article: { headline: "Post" },
    });
    const article = nodeOf(result, "Article")!;
    const webPage = nodeOf(result, "WebPage")!;
    const webSite = nodeOf(result, "WebSite")!;

    expect(article.mainEntityOfPage["@id"]).toBe(webPage["@id"]);
    expect(webPage.isPartOf["@id"]).toBe(webSite["@id"]);
    expect(webSite.publisher["@id"]).toBe(
      nodeOf(result, "Organization")!["@id"],
    );
    expect(article.publisher["@id"]).toBe(
      nodeOf(result, "Organization")!["@id"],
    );
  });

  it("references the site Person when the byline matches the site author", () => {
    const result = siteGraph({
      site: testSite,
      base,
      canonical,
      title: "Post",
      description: "desc",
      isArticle: true,
      article: { headline: "Post", authorName: testSite.author.name },
    });
    expect(nodeOf(result, "Article")!.author["@id"]).toBe(
      nodeOf(result, "Person")!["@id"],
    );
  });

  it("inlines a guest Person for a byline that is not the site author", () => {
    const result = siteGraph({
      site: testSite,
      base,
      canonical,
      title: "Post",
      description: "desc",
      isArticle: true,
      article: { headline: "Post", authorName: "Guest Writer" },
    });
    expect(nodeOf(result, "Article")!.author).toEqual({
      "@type": "Person",
      name: "Guest Writer",
    });
  });

  it("omits LocalBusiness unless site.business is configured", () => {
    const without = siteGraph({
      site: testSite,
      base,
      canonical,
      title: "t",
      description: "d",
    });
    expect(nodeOf(without, "LocalBusiness")).toBeUndefined();

    const withBusiness = siteGraph({
      site: {
        ...testSite,
        business: {
          telephone: "+81-3-0000-0000",
          openingHours: ["Mo-Fr 09:00-18:00"],
        },
      },
      base,
      canonical,
      title: "t",
      description: "d",
    });
    const business = nodeOf(withBusiness, "LocalBusiness")!;
    expect(business.telephone).toBe("+81-3-0000-0000");
    // openingHours (text form), never the openingHoursSpecification object.
    expect(business.openingHours).toEqual(["Mo-Fr 09:00-18:00"]);
  });

  it("honours a custom schema.org type for the business", () => {
    const result = siteGraph({
      site: { ...testSite, business: { type: "Restaurant" } },
      base,
      canonical,
      title: "t",
      description: "d",
    });
    expect(nodeOf(result, "Restaurant")).toBeDefined();
  });

  it("numbers breadcrumb positions from 1 and keeps input order", () => {
    const result = siteGraph({
      site: testSite,
      base,
      canonical,
      title: "Post",
      description: "desc",
      breadcrumbs: [
        { name: "Home", url: base },
        { name: "Blog", url: "https://example.com/blog" },
        { name: "Post", url: canonical },
      ],
    });
    const list = nodeOf(result, "BreadcrumbList")!.itemListElement;
    expect(list.map((i: any) => i.position)).toEqual([1, 2, 3]);
    expect(list.map((i: any) => i.name)).toEqual(["Home", "Blog", "Post"]);
    // WebPage points at the breadcrumb only when there is one.
    expect(nodeOf(result, "WebPage")!.breadcrumb["@id"]).toBe(
      nodeOf(result, "BreadcrumbList")!["@id"],
    );
  });

  it("appends page-specific extra nodes last", () => {
    const extra = { "@type": "FAQPage", "@id": `${canonical}#faq` };
    const graph = graphOf(
      siteGraph({
        site: testSite,
        base,
        canonical,
        title: "t",
        description: "d",
        extra: [extra],
      }),
    );
    expect(graph.at(-1)).toEqual(extra);
  });

  it("builds absolute URLs from the configured origin", () => {
    const result = siteGraph({
      site: testSite,
      base,
      canonical,
      title: "t",
      description: "d",
    });
    const organization = nodeOf(result, "Organization")!;
    expect(organization.url).toBe("https://example.com/");
    expect(organization.logo.url).toBe("https://example.com/icon-512.png");
  });
});
