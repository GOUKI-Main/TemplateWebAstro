import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { site as siteConfig } from "./src/content/site";
import { isNoindexPath } from "./src/lib/noindex";

// The site origin drives canonical URLs, sitemap and JSON-LD. It is a
// committed value in site.ts (no .env, no build variables), so the whole site
// can be configured by editing files — from a phone, if need be.
const site = siteConfig.url;

// https://astro.build/config
export default defineConfig({
  site,
  // Single, predictable URL shape (no trailing slash) so canonical,
  // internal links and sitemap all agree. (§1 URL正規化)
  trailingSlash: "never",
  // Prefetch links on hover to improve perceived navigation speed. (§8)
  // This is the ONLY runtime JavaScript the starter ships (~2.3 kB, one module
  // on every page). Remove this block for a strictly zero-JS build, or keep it
  // and opt individual links in with `data-astro-prefetch`.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [
    sitemap({
      // Keep noindex paths out of the sitemap. The match itself lives in
      // src/lib/noindex.ts because Base.astro asks the same question for
      // meta robots — sharing the function is what stops the two from
      // drifting apart. (§1/§2)
      filter: (page) =>
        !isNoindexPath(new URL(page).pathname, siteConfig.seo.noindexPaths),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
