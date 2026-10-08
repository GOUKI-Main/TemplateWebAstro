// Path matching for `site.seo.noindexPaths`.
//
// WHY THIS IS ITS OWN MODULE: the same list drives two outputs that live in
// different worlds — the `<meta name="robots">` of a page (src/layouts/
// Base.astro) and the sitemap's `filter` (astro.config.mjs). Until this
// existed, both spelled the prefix match out by hand, so a change to one left
// the other quietly disagreeing: a page carrying `noindex` while still listed
// in the sitemap, or the reverse. Neither shows up in the build, the tests or
// the link check.
//
// astro.config.mjs is evaluated before the content layer, so anything it
// imports has to be a plain function with no `astro:*` dependency. This module
// is exactly that (same constraint as src/lib/lastmod.ts).
//
// WHY IT IS NOT IN src/lib/seo/: that directory is the JSON-LD layer, which is
// removable as a unit (`rm -rf src/lib/seo` — see FEATURES.md §3.2-l). noindex
// is meta robots and sitemap exclusion, which have nothing to do with
// structured data and should survive that removal.

/**
 * Drop trailing slashes so `/about/` and `/about` are the same path, and the
 * site root always reads as `/`.
 *
 * Applied to the entries as well as the path being tested: the site is
 * `trailingSlash: "never"`, but @astrojs/sitemap hands its filter URLs that
 * carry one, and a hand-written entry like `"/drafts/"` should still match.
 */
const normalize = (pathname: string) => pathname.replace(/\/+$/, "") || "/";

/**
 * True when `pathname` is one of `noindexPaths` or sits underneath one.
 *
 * A prefix match, not a substring match: `/draft` does not match `/drafts`.
 */
export function isNoindexPath(
  pathname: string,
  noindexPaths: readonly string[],
): boolean {
  const path = normalize(pathname);
  return noindexPaths.some((rawEntry) => {
    const entry = normalize(rawEntry);
    // The root entry would otherwise match every page through the prefix
    // branch below (`"/" + "/"` is not a prefix of anything, but a future
    // refactor could easily make it one). Treat it as "the home page only".
    if (entry === "/") return path === "/";
    return path === entry || path.startsWith(`${entry}/`);
  });
}
