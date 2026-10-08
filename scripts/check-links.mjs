#!/usr/bin/env node
// Internal link checker for the built site.
//
// Walks every HTML file in dist/, collects internal href/src targets and
// asserts each one resolves to a file that was actually built. Catches the
// most common static-site regression — a renamed route leaving dead links
// behind — with no network access and no dependencies, so it is safe to run
// in CI on every push.
//
// External links are intentionally NOT fetched: they fail for reasons outside
// the repo (rate limits, outages, placeholder URLs) and would make CI flaky.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const DIST = resolve("dist");

/** Every file under dist/, as site-absolute paths ("/about/index.html"). */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

let files;
try {
  files = walk(DIST);
} catch {
  console.error("dist/ not found — run `pnpm build` first.");
  process.exit(1);
}

const built = new Set(
  files.map((f) => `/${relative(DIST, f).replaceAll("\\", "/")}`),
);
const htmlFiles = files.filter((f) => f.endsWith(".html"));

/** Does this site-absolute path exist in the build output? */
function resolves(pathname) {
  const clean = pathname.replace(/\/+$/, "");
  return (
    built.has(pathname) ||
    built.has(clean) ||
    built.has(`${clean}/index.html`) ||
    built.has(`${clean}.html`) ||
    clean === "" // "/" -> /index.html, covered below
  );
}

const ATTR = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const failures = [];
let checked = 0;

for (const file of htmlFiles) {
  const from = `/${relative(DIST, file).replaceAll("\\", "/")}`;
  const html = readFileSync(file, "utf8");

  for (const [, raw] of html.matchAll(ATTR)) {
    const value = raw.trim();
    // Skip anything that does not point at a path inside this site.
    if (
      value === "" ||
      value.startsWith("#") ||
      value.startsWith("//") ||
      value.startsWith("data:") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:") ||
      /^[a-z][a-z0-9+.-]*:/i.test(value)
    ) {
      continue;
    }
    if (!value.startsWith("/")) {
      failures.push(
        `${from}: relative link "${value}" — use site-absolute paths`,
      );
      continue;
    }

    const pathname = decodeURI(value.split("#")[0].split("?")[0]);
    checked++;
    if (pathname === "/" ? !built.has("/index.html") : !resolves(pathname)) {
      failures.push(`${from}: dead link -> ${value}`);
    }
  }
}

// robots.txt is checked separately because it is not HTML: the walk above only
// reads href/src out of pages, so its `Sitemap:` line is invisible to it. That
// line is also the one internal reference in the build with nothing pointing
// back at it — drop the sitemap integration from astro.config.mjs and robots
// keeps advertising a URL that no longer gets generated. The build succeeds,
// `astro check` succeeds, and crawlers get a 404. (The equivalent
// `<link rel="sitemap">` in the <head> IS caught above, so without this the
// two halves of the same removal fail very differently.)
const ROBOTS = "/robots.txt";
if (built.has(ROBOTS)) {
  const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
  for (const [, raw] of robots.matchAll(/^\s*Sitemap:\s*(\S+)/gim)) {
    checked++;
    let pathname;
    try {
      // The directive requires an absolute URL, so the origin is whatever
      // site.url was at build time — only the path can be verified here.
      pathname = decodeURI(new URL(raw).pathname);
    } catch {
      failures.push(`${ROBOTS}: Sitemap must be an absolute URL -> ${raw}`);
      continue;
    }
    if (!resolves(pathname)) {
      failures.push(`${ROBOTS}: dead sitemap reference -> ${raw}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} broken internal link(s):\n`);
  for (const failure of [...new Set(failures)].sort()) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(
  `✓ ${checked} internal links across ${htmlFiles.length} pages${
    built.has(ROBOTS) ? " + robots.txt" : ""
  } all resolve.`,
);
