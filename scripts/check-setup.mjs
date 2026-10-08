// Lists what the template setup (CLAUDE.md「初期セットアップ」) has not filled
// in yet. Exit code 1 while anything is left, so "done" is checkable rather
// than a judgement call. Deliberately NOT part of CI: the template itself is
// supposed to fail this.
import { readFile, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const MARKER = "TODO(setup)";
const SCAN = ["src", "public/favicon.svg", "public/_headers", "wrangler.jsonc"];
const TEXT = /\.(astro|ts|mjs|js|css|md|jsonc?|txt|svg)$|_headers$/;

async function* walk(rel) {
  const url = new URL(rel, root);
  let entries;
  try {
    entries = await readdir(url, { withFileTypes: true });
  } catch {
    yield rel; // a file, not a directory
    return;
  }
  for (const e of entries) yield* walk(`${rel}/${e.name}`);
}

const problems = [];
for (const start of SCAN) {
  for await (const rel of walk(start)) {
    if (!TEXT.test(rel)) continue;
    const text = await readFile(new URL(rel, root), "utf8");
    text.split("\n").forEach((line, i) => {
      if (line.includes(MARKER))
        problems.push(`${rel}:${i + 1}  ${line.trim()}`);
    });
  }
}

// Values that cannot carry a comment marker.
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
if (pkg.name === "template-web-astro")
  problems.push('package.json  "name" is still "template-web-astro"');
const wrangler = await readFile(new URL("wrangler.jsonc", root), "utf8");
if (/"name":\s*"template-web-astro"/.test(wrangler))
  problems.push('wrangler.jsonc  "name" is still "template-web-astro"');

if (problems.length) {
  console.log(`setup: ${problems.length} item(s) left\n`);
  for (const p of problems) console.log(`  ${p}`);
  process.exit(1);
}
console.log("setup: complete — no TODO(setup) markers left");
