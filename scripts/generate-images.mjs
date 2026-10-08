// Regenerates the raster images the site ships from their sources, so the
// setup flow (CLAUDE.md「初期セットアップ」) never hand-edits a PNG.
//
//   node scripts/generate-images.mjs icons
//       public/favicon.svg -> icon-192.png, icon-512.png,
//       apple-touch-icon.png (180), favicon.ico (32, PNG-in-ICO)
//
//   node scripts/generate-images.mjs og <image>
//       Cover-crops any photo/logo to 1200x630 -> public/images/og/og-default.jpg
//
//   node scripts/generate-images.mjs og-text
//       Draws site.name + site.tagline on the --color-bg / --color-fg tokens.
//       Japanese glyphs come from whatever CJK font the machine has
//       (librsvg + fontconfig), so LOOK at the output before committing it.
//
// sharp is already a dependency (astro:assets uses it), so this adds nothing.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const at = (p) => new URL(p, root);

const OG = { width: 1200, height: 630 };
const OG_OUT = at("public/images/og/og-default.jpg");

async function icons() {
  const svg = await readFile(at("public/favicon.svg"));
  const png = (size) =>
    sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

  for (const [file, size] of [
    ["public/icon-192.png", 192],
    ["public/icon-512.png", 512],
    ["public/apple-touch-icon.png", 180],
  ]) {
    await writeFile(at(file), await png(size));
  }

  // ICO container holding a single PNG image (supported by every current
  // browser); avoids pulling in an ICO encoder for one 32px file.
  const ico32 = await png(32);
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  header.writeUInt8(32, 6); // width
  header.writeUInt8(32, 7); // height
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(ico32.length, 14); // image size
  header.writeUInt32LE(22, 18); // image offset
  await writeFile(at("public/favicon.ico"), Buffer.concat([header, ico32]));
  console.log("icons: wrote icon-192, icon-512, apple-touch-icon, favicon.ico");
}

async function ogFromImage(input) {
  if (!input) throw new Error("usage: generate-images.mjs og <image>");
  await sharp(input)
    .resize(OG.width, OG.height, { fit: "cover", position: "attention" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(OG_OUT.pathname);
  console.log(`og: wrote ${OG_OUT.pathname} from ${input}`);
}

// Pull a token's light value (its first occurrence = the @theme block).
const token = (css, name) =>
  css.match(new RegExp(`--color-${name}:\\s*([^;]+);`))?.[1].trim();

const escapeXml = (s) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );

async function ogFromText() {
  // site.ts is TypeScript; read the two strings rather than importing it.
  const src = await readFile(at("src/content/site.ts"), "utf8");
  const field = (key) =>
    src.match(new RegExp(`\\n  ${key}:\\s*\\n?\\s*"([^"]*)"`))?.[1] ?? "";
  const name = field("name");
  const tagline = field("tagline");
  const css = await readFile(at("src/styles/global.css"), "utf8");
  const bg = token(css, "bg") ?? "#fbfbf9";
  const fg = token(css, "fg") ?? "#1a1a1a";
  const accent = token(css, "link") ?? fg;
  const font =
    "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans CJK JP','Noto Sans JP','Yu Gothic','Meiryo','WenQuanYi Zen Hei',sans-serif";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG.width}" height="${OG.height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <rect x="96" y="250" width="12" height="130" fill="${accent}"/>
  <text x="140" y="305" font-family="${font}" font-size="64" font-weight="700" fill="${fg}">${escapeXml(name)}</text>
  <text x="140" y="370" font-family="${font}" font-size="34" fill="${fg}" fill-opacity="0.75">${escapeXml(tagline)}</text>
</svg>`;
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(OG_OUT.pathname);
  console.log(`og-text: wrote ${OG_OUT.pathname} ("${name}")`);
}

const [cmd, arg] = process.argv.slice(2);
const run = { icons, og: () => ogFromImage(arg), "og-text": ogFromText }[cmd];
if (!run) {
  console.error("usage: generate-images.mjs <icons | og <image> | og-text>");
  process.exit(1);
}
await run();
