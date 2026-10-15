#!/usr/bin/env node
// Structured-data (JSON-LD) checker for the built site.
//
// The unit tests pin how jsonld.ts wires nodes together; this checks what
// actually shipped: every page in dist/ carries exactly one parseable
// `@graph`, every node has a unique `@id`, and every `{ "@id": … }` reference
// resolves within the same page. It then prints the site-level facts the
// graph tells search engines (who runs the site, address, hours, profiles) so
// a human can confirm them — that summary is what the setup flow in
// CLAUDE.md shows the site owner.
//
// `--strict` additionally fails while template placeholder values are still
// in the graph. CI runs it without the flag: the template itself is
// supposed to carry placeholders.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const DIST = resolve("dist");
const strict = process.argv.includes("--strict");

/** Values from the template's site.ts that must not reach a real site.
 *  example.com is not among them: an undecided domain is allowed to stay
 *  until launch (Q14), so it is only ever reported as a note. */
const PLACEHOLDERS = [
  "サイト名",
  "運営者名",
  "株式会社〇〇",
  "0000-0000",
  "XXXX",
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".html")) out.push(full);
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

const SCRIPT_RE =
  /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;

const errors = [];
const placeholderHits = new Set();
let home;

for (const file of files) {
  const page = `/${relative(DIST, file).replaceAll("\\", "/")}`;
  const html = readFileSync(file, "utf8");
  const blocks = [...html.matchAll(SCRIPT_RE)].map((m) => m[1]);

  // Redirect stubs and the like carry no head metadata at all.
  if (blocks.length === 0) {
    if (/<link[^>]+rel=["']?canonical/i.test(html))
      errors.push(`${page}: no JSON-LD`);
    continue;
  }
  if (blocks.length > 1) {
    errors.push(`${page}: ${blocks.length} JSON-LD blocks (expected one)`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(blocks[0]);
  } catch (e) {
    errors.push(`${page}: JSON-LD does not parse (${e.message})`);
    continue;
  }
  if (
    data["@context"] !== "https://schema.org" ||
    !Array.isArray(data["@graph"])
  ) {
    errors.push(
      `${page}: expected { "@context": "https://schema.org", "@graph": [...] }`,
    );
    continue;
  }

  // Same rule as jsonld.test.ts: an object with an @id plus other keys
  // defines a node; an object whose only key is @id references one.
  const defined = [];
  const references = [];
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value === "string") {
      for (const p of PLACEHOLDERS)
        if (value.includes(p)) placeholderHits.add(p);
      return;
    }
    if (!value || typeof value !== "object") return;
    const keys = Object.keys(value);
    if (typeof value["@id"] === "string") {
      if (keys.length === 1) return void references.push(value["@id"]);
      defined.push(value["@id"]);
    }
    for (const k of keys) if (k !== "@id") visit(value[k]);
  };
  data["@graph"].forEach(visit);

  for (const node of data["@graph"])
    if (!node["@id"] || !node["@type"])
      errors.push(`${page}: a node is missing @id or @type`);
  const dupes = defined.filter((id, i) => defined.indexOf(id) !== i);
  for (const id of new Set(dupes)) errors.push(`${page}: duplicate @id ${id}`);
  for (const ref of references)
    if (!defined.includes(ref)) errors.push(`${page}: unresolved @id ${ref}`);

  if (page === "/index.html") home = data["@graph"];
}

// ── Summary of what the site tells search engines ───────────────────────
if (home) {
  const byId = new Map(home.map((n) => [n["@id"], n]));
  const ofType = (t) =>
    home.find(
      (n) => [n["@type"]].flat().includes(t) && !n["@id"].includes("#webpage"),
    );
  const website = ofType("WebSite");
  const publisher = website && byId.get(website.publisher?.["@id"]);
  const business = home.find((n) => n["@id"].endsWith("#localbusiness"));
  const line = (label, value) =>
    value !== undefined && value !== "" && console.log(`  ${label}: ${value}`);

  console.log("JSON-LD (トップページ) が検索エンジンに伝える内容:\n");
  line("サイト名", website?.name);
  line("URL", website?.url);
  line("説明", website?.description);
  if (publisher) {
    const kind = publisher["@type"] === "Person" ? "個人" : "組織";
    line("運営者", `${publisher.name}（${kind} / ${publisher["@type"]}）`);
    line("ロゴ", publisher.logo?.url ?? publisher.image);
    line("SNS等", publisher.sameAs?.join(" , "));
  }
  if (business) {
    const a = business.address;
    line("事業所", `${business.name}（${business["@type"]}）`);
    line(
      "住所",
      a &&
        `〒${a.postalCode} ${a.addressRegion ?? ""}${a.addressLocality}${a.streetAddress}`,
    );
    line("電話", business.telephone);
    line("メール", business.email);
    line("営業時間", business.openingHours?.join(" / "));
    line("価格帯", business.priceRange);
    line("対応エリア", business.areaServed?.join(" , "));
    line("地図", business.hasMap);
    line(
      "緯度経度",
      business.geo && `${business.geo.latitude}, ${business.geo.longitude}`,
    );
  } else {
    console.log("  （店舗・事業所の情報 = LocalBusiness は出力していません）");
  }
  console.log("");
  if (website?.url?.includes("example.com"))
    console.log("note: 公開URLが未設定です（site.ts の url）\n");
}

if (placeholderHits.size) {
  const msg = `テンプレートの仮の値が残っています: ${[...placeholderHits].join(", ")}`;
  if (strict) errors.push(msg);
  else console.log(`note: ${msg}\n`);
}

if (errors.length) {
  console.error(`JSON-LD: ${errors.length} problem(s)\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`JSON-LD: ${files.length} HTML file(s) checked, all graphs valid`);
