import type { APIRoute } from "astro";
import { site } from "../content/site";

// Web App Manifest, generated from the single site config so name/colors/icons
// stay in sync with the rest of the site. (§8 PWA / 設定の集約)
export const GET: APIRoute = () => {
  const manifest = {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    theme_color: site.seo.themeColor,
    background_color: site.seo.themeColor,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
};
