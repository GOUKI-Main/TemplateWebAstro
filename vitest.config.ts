/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// getViteConfig gives the tests the same resolution rules as the build, so
// `astro:*` virtual modules and the content layer are available in specs.
export default getViteConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
