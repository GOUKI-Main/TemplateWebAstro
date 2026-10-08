import { describe, expect, it } from "vitest";
import { isNoindexPath } from "./noindex";

// This function is the single point both `<meta name="robots">` and the
// sitemap filter go through, so what is asserted here is really "the two
// outputs cannot disagree". The cases are the shapes each caller actually
// hands it: Base.astro passes a canonical path, astro.config.mjs passes the
// pathname of a sitemap URL, which carries a trailing slash.

describe("isNoindexPath", () => {
  it("returns false when nothing is configured", () => {
    expect(isNoindexPath("/anything", [])).toBe(false);
  });

  it("matches an exact path", () => {
    expect(isNoindexPath("/drafts", ["/drafts"])).toBe(true);
    expect(isNoindexPath("/about", ["/drafts"])).toBe(false);
  });

  it("matches descendants of a listed path", () => {
    expect(isNoindexPath("/drafts/one", ["/drafts"])).toBe(true);
    expect(isNoindexPath("/drafts/one/two", ["/drafts"])).toBe(true);
  });

  it("is a prefix match on segments, not on characters", () => {
    // The bug this guards: `startsWith("/draft")` alone would swallow
    // `/drafts`, silently deindexing a sibling section.
    expect(isNoindexPath("/drafts", ["/draft"])).toBe(false);
    expect(isNoindexPath("/aboutus", ["/about"])).toBe(false);
  });

  it("ignores a trailing slash on the path", () => {
    // @astrojs/sitemap hands the filter URLs with a trailing slash even under
    // trailingSlash: "never", so this is the sitemap caller's real input.
    expect(isNoindexPath("/drafts/", ["/drafts"])).toBe(true);
    expect(isNoindexPath("/drafts/one/", ["/drafts"])).toBe(true);
  });

  it("ignores a trailing slash on the entry", () => {
    expect(isNoindexPath("/drafts", ["/drafts/"])).toBe(true);
    expect(isNoindexPath("/drafts/one", ["/drafts/"])).toBe(true);
  });

  it("treats a root entry as the home page only", () => {
    expect(isNoindexPath("/", ["/"])).toBe(true);
    expect(isNoindexPath("/about", ["/"])).toBe(false);
  });

  it("matches against any entry in the list", () => {
    const paths = ["/drafts", "/internal"];
    expect(isNoindexPath("/internal/notes", paths)).toBe(true);
    expect(isNoindexPath("/blog", paths)).toBe(false);
  });
});
