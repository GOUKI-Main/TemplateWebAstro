import type { APIRoute } from "astro";

// robots.txt — allow crawling (noindex is handled per-page via meta, not by
// blocking here, so crawlers can actually read the noindex). Points to the
// sitemap from the configured site origin. (§2 / 設計上の勘所)
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL("sitemap-index.xml", site).toString();
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
