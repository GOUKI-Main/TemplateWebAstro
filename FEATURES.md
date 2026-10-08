# 機能一覧と削除ガイド

このスターターに入っている機能を、**「要らなくなったときに何を消せばいいか」**
という観点で棚卸しした表です。設計上の制約は `CLAUDE.md`、使い方は `README.md`
を参照してください。ここは削除のための地図です。

参照はファイルパスと**検索用の目印文字列**で書いています（行番号は編集ですぐ
ズレるため）。目印はエディタの検索にそのまま貼れます。

---

## 0. 分類の読み方

| 分類         | 意味                                                         |
| ------------ | ------------------------------------------------------------ |
| **常設**     | 消す前提がない土台。消す手順は用意しない                     |
| **独立**     | 1〜2ファイルで完結。消しても他が壊れない                     |
| **要手当て** | 複数ファイルに散っている。消し漏れると静かに壊れる箇所がある |
| **重い**     | 削除が広範囲に波及する。§5 の密結合レポートを先に読むこと    |

**既定** 列は「何も設定しない状態で有効かどうか」です。`env` は環境変数が
設定されたときだけ有効になるもの。

番号の欠番には2種類あります。B5・B6・B8、C8・C9・C11、D1、§3.3、§5-6 は、
テンプレート化の際に削除したブログ機能（関連記事・ページネーション・RSS・表の
横スクロール・ヒーロー画像・タグアーカイブ・ブログ一式）のものです。C6 と
§3.2-f（セルフホストフォント）は、フォントのライセンス文を同梱する手間を
なくすため、システムフォントに置き換えたので欠番です。

---

## 1. 一覧表

### 1.1 常設（消す前提がない）

| 機能                                  | 実体                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------- |
| タイトル / description / canonical    | `src/components/SEO.astro`、`src/layouts/Base.astro`                       |
| charset / viewport                    | `src/components/SEO.astro`                                                 |
| Base レイアウト（head + ページ外枠）  | `src/layouts/Base.astro`                                                   |
| Header / NavLinks / Footer / ナビ設定 | `src/components/{Header,NavLinks,Footer}.astro`、`site.ts` の `nav`        |
| 設定の集約（`site.ts`）               | `src/content/site.ts`                                                      |
| サイトオリジン（`url`→`Astro.site`）  | `site.ts` の `url`、`astro.config.mjs`                                     |
| URL 正規化（末尾スラッシュなし）      | `astro.config.mjs` の `trailingSlash`、`wrangler.jsonc` の `html_handling` |
| デザイントークン（`@theme`）          | `src/styles/global.css` の `@theme {`                                      |
| 共通コンテナ（`container-page`）      | `src/styles/global.css` の `@utility container-page`                       |
| 横スクロール防止（2層）               | `global.css` の `overflow-wrap: anywhere` と `:where(img, svg, …)`         |
| 404 ページ                            | `src/pages/404.astro`                                                      |
| Prettier / TypeScript 設定            | `.prettierrc`、`tsconfig.json`                                             |

> タップ領域（`tap-target`）と本文スタイル（`prose`）も実質は常設です。理由と
> 「それでも消すなら」は §5-7 / §5-5 に書きました。

### 1.2 独立して消せる

| #   | 機能                      | 既定 | 実体                                                           | 手順   |
| --- | ------------------------- | ---- | -------------------------------------------------------------- | ------ |
| B1  | Cloudflare Web Analytics  | env  | `src/components/Cloudflare.astro`                              | §3.1-a |
| B2  | Search Console 認証メタ   | env  | `src/components/SEO.astro` の `gscVerification`                | §3.1-b |
| B3  | リンク先読み（唯一の JS） | ON   | `astro.config.mjs` の `prefetch:`                              | §3.1-c |
| B4  | FAQ（`<details>`）        | ON   | `src/components/FAQ.astro`                                     | §3.1-d |
| B7  | モバイルメニュー          | ON   | `src/components/Header.astro` の `<details class="md:hidden">` | §3.1-g |
| B9  | `robots.txt`              | ON   | `src/pages/robots.txt.ts`                                      | §3.1-i |
| B10 | LocalBusiness + NAP 表示  | OFF  | `site.ts` の `business:`、`BusinessInfo.astro`、`jsonld.ts`    | §3.1-j |
| B11 | セキュリティヘッダ        | ON   | `public/_headers`                                              | §3.1-k |
| B12 | 内部リンク検査            | ON   | `scripts/check-links.mjs`                                      | §3.1-l |
| B13 | 単体テスト（Vitest）      | ON   | `src/**/*.test.ts`、`vitest.config.ts`                         | §3.1-m |
| B14 | reduced-motion 対応       | ON   | `src/styles/global.css` の `prefers-reduced-motion`            | §3.1-n |
| B15 | スキップリンク            | ON   | `src/components/SkipLink.astro`                                | §3.1-o |

### 1.3 消せるが手当てが要る

| #   | 機能                          | 既定 | 実体（起点）                                       | 手順   | 消し漏れ注意                    |
| --- | ----------------------------- | ---- | -------------------------------------------------- | ------ | ------------------------------- |
| C1  | OG / Twitter カード           | ON   | `SEO.astro`、`Base.astro`、`site.ts` の `ogImage*` | §3.2-a | Twitter カードも連動            |
| C2  | PWA（webmanifest / アイコン） | ON   | `src/pages/site.webmanifest.ts`                    | §3.2-b | favicon は別。残すこと          |
| C3  | サイトマップ                  | ON   | `astro.config.mjs` の `sitemap({`                  | §3.2-c | `robots.txt` の `Sitemap:` 行も |
| C4  | noindex 制御                  | ON※  | `site.ts` の `noindexPaths`                        | §3.2-d | 判定は共通関数に集約済み        |
| C5  | theme-color                   | ON   | `SEO.astro` の `theme-color`、`site.ts`            | §3.2-e | webmanifest も同じ値を読む      |
| C7  | ダークモード                  | ON   | `global.css` の `prefers-color-scheme: dark`       | §3.2-g | `themeColorDark` も一緒に       |
| C10 | パンくず（表示）              | OFF  | `src/components/Breadcrumbs.astro`                 | §3.2-j | 下層ページ用。現状は未使用      |
| C12 | JSON-LD 構造化データ          | ON   | `src/lib/seo/jsonld.ts`                            | §3.2-l | パンくず表示は無修正で残せる    |

※ C4 は配線済みだが `noindexPaths: []` なので既定では何も起きない。

---

## 2. 検証済みの削除パターン

以下は実際にファイルを消して**ビルド・型チェック・リンク検査・テストが通ること
を確認済み**です（`astro check` 0 errors）。

| パターン                             | 結果                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| ブログ一式を削除（テンプレート化時） | 10ページ → 5ページ、リンク88本すべて解決、0 errors                       |
| JSON-LD を削除（§3.2-l）             | `ld+json` の出力 0、パンくず表示は維持、`Breadcrumbs.astro` は**無修正** |
| 最小構成（下記をまとめて削除）       | ページ数維持、0 errors（ブログ削除前に検証）                             |

最小構成でまとめて消した内訳：サイトマップ、フォント、prefetch、PWA、
Analytics、GSC メタ、theme-color、ダークモード。

§5 の対処が実際に効いているかも、同じやり方で確認しています。

| 確認したこと                                            | 結果                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| sitemap integration だけ消す（`robots.txt` は消し忘れ） | `check:links` が `dead sitemap reference` で終了コード 1（§5-2） |
| `noindexPaths: ["/legal"]` を設定してビルド             | `/legal` に `noindex,nofollow` かつ sitemap から除外（§5-3）     |
| `--tap-min` 集約後のコンパイル結果                      | `any-pointer: coarse` の出現が 2 → 1、寸法は同値（§5-7）         |

---

## 3. 削除レシピ

### 3.1 独立して消せるもの

#### a. Cloudflare Web Analytics

1. `src/components/Cloudflare.astro` を削除
2. `src/layouts/Base.astro` から `import Cloudflare` と `<Cloudflare />` を削除
3. `src/content/site.ts` の `cloudflareBeaconToken`（型とコメント）を削除
4. `public/_headers` の CSP 雛形から `static.cloudflareinsights.com` /
   `cloudflareinsights.com` を削除

> トークン未設定なら何も出力されないので、「今すぐ止めたいだけ」なら
> `site.ts` の `cloudflareBeaconToken` を消すだけで足ります。

#### b. Search Console 認証メタ

1. `src/components/SEO.astro` の `const gscVerification` 行と、それを使う
   `{ gscVerification && ( … ) }` ブロックを削除
2. `src/content/site.ts` の `seo.googleSiteVerification`（型とコメント）を削除

#### c. リンク先読み（唯一のランタイム JS）

`astro.config.mjs` の `prefetch: { … }` を削除。これで JS 出力がゼロになります。
個別のリンクだけ残したい場合は `prefetch: { prefetchAll: false }` にして
`data-astro-prefetch` を付ける運用に切り替え。

#### d. FAQ

1. `src/components/FAQ.astro` を削除
2. `src/pages/index.astro` の `import FAQ`、`const faqs = [ … ]`、`<FAQ … />`
   を削除

#### g. モバイルメニュー

`src/components/Header.astro` の `<details class="md:hidden">` 全体を削除し、
デスクトップ用 `<div class="hidden md:block">` のラッパを外して常時表示に。
ナビ項目が増えると狭い画面で溢れるので、代替（フッターナビ等）を用意してから。

#### i. `robots.txt`

`src/pages/robots.txt.ts` を削除。noindex は meta 側（§3.2-d）で管理しているので
クロール制御が消えるわけではありません。

#### j. LocalBusiness + NAP 表示

既定でコメントアウト済み。完全に消すなら:

1. `src/content/site.ts` の `BusinessConfig` 型、`business?:` フィールド、
   コメントアウトされた `business: { … }` の例を削除
2. `src/components/BusinessInfo.astro` を削除
3. `src/pages/contact.astro` と `src/pages/about.astro` の `import BusinessInfo` と
   `<BusinessInfo />` を削除
4. `src/lib/seo/jsonld.ts` の `localBusinessNode` と、`siteGraph` 内の
   `const business = localBusinessNode(…)` の2行を削除
5. `src/lib/seo/jsonld.test.ts` の LocalBusiness テストを削除

#### k. セキュリティヘッダ

`public/_headers` を削除（`/_astro/*` のキャッシュ設定も消えるので、その塊は
残すことを推奨）。

#### l. 内部リンク検査

`scripts/check-links.mjs` を削除し、`package.json` の `check:links` と
`.github/workflows/ci.yml` の該当ステップを削除。

#### m. 単体テスト

`src/**/*.test.ts` と `vitest.config.ts` を削除し、`package.json` の
`test` / `test:watch` と `vitest` 依存、CI の該当ステップを削除。

#### n. reduced-motion 対応

`src/styles/global.css` の `@media (prefers-reduced-motion: reduce)` ブロックを
削除。現状これが効いているのは FAQ の `+` 記号の回転だけです。

#### o. スキップリンク

`src/components/SkipLink.astro` を削除し、`Base.astro` の import と
`<SkipLink />` を削除。**アクセシビリティ要件（WCAG 2.4.1）なので非推奨**です。

---

### 3.2 手当てが要るもの

#### a. OG / Twitter カード

1. `src/components/SEO.astro`: `{/* Open Graph (§5) */}` と
   `{/* Twitter (§5) */}` のブロック、`const ogImageUrl` / `const hasOg`、
   props の `ogImage` / `ogImageWidth` / `ogImageHeight` / `ogImageAlt` /
   `ogType` / `article` を削除
2. `src/layouts/Base.astro`: `ogImageSrc` / `ogImageWidth` / `ogImageHeight` の
   算出ブロックと、Props 型の同名フィールドを削除
3. `src/content/site.ts`: `seo.ogImage` / `ogImageWidth` / `ogImageHeight` /
   `twitterSite` を削除
4. `public/images/og/og-default.jpg` を削除
5. JSON-LD を残す場合、`Base.astro` の `article.image` が `ogImageSrc` を
   参照しているので、その行を削除する

> SNS 共有時のカードが出なくなります。**消す判断は慎重に。**

#### b. PWA（webmanifest / アイコン）

1. `src/pages/site.webmanifest.ts` を削除
2. `src/components/SEO.astro` の `<link rel="manifest" …>` を削除
3. 不要なら `public/icon-192.png` / `icon-512.png` /
   `apple-touch-icon.png` を削除し、`<link rel="apple-touch-icon">` も削除
4. `src/content/site.ts` の `seo.logo`（`/icon-512.png`）は JSON-LD の
   Organization ロゴにも使われる。JSON-LD を残すなら別画像に差し替える

> `favicon.svg` / `favicon.ico` と `<link rel="icon">` は PWA とは別物なので
> 残してください。

#### c. サイトマップ

1. `astro.config.mjs`: `import sitemap` と `integrations: [ sitemap({ … }) ]`
   を削除
2. `src/components/SEO.astro` の `<link rel="sitemap" …>` を削除
3. **`src/pages/robots.txt.ts` の `Sitemap: ${sitemapUrl}` 行と
   `const sitemapUrl` を削除**
4. `package.json` から `@astrojs/sitemap` を削除

> 手順2・3はどちらを飛ばしても `pnpm check:links` が落ちます（手順2は HTML の
> `<link>`、手順3は `robots.txt` の `Sitemap:` 行を検査します）。以前は手順3の
> 消し漏れだけが無検出でしたが、§5-2 の対処で塞いであります。

#### d. noindex 制御

1. `src/lib/noindex.ts` と `src/lib/noindex.test.ts` を削除
2. `src/content/site.ts` の `seo.noindexPaths` を削除
3. `src/layouts/Base.astro`: `import { isNoindexPath }` を削除し、`const robots`
   を `Astro.props.robots ?? site.seo.robots` に単純化
4. `astro.config.mjs`: `import { isNoindexPath }` と `sitemap({ filter: … })`
   を削除

> 判定は `src/lib/noindex.ts` の1関数に集約済みなので、meta 側と sitemap 側が
> 食い違う消し方はできません（§5-3）。

> `src/pages/404.astro` は `robots="noindex,nofollow"` を直接渡しているので
> 影響を受けません。

#### e. theme-color

1. `src/components/SEO.astro`: `themeColor` / `themeColorDark` の props と、
   `{/* Two media-scoped values … */}` 直後の `<meta name="theme-color">`
   ブロックを削除
2. `src/content/site.ts`: `seo.themeColor` / `themeColorDark` を削除
3. **`src/pages/site.webmanifest.ts` が `site.seo.themeColor` を
   `theme_color` / `background_color` に使っている** ので、PWA を残すなら
   リテラルに置き換える

#### g. ダークモード

1. `src/styles/global.css`: `@media (prefers-color-scheme: dark) { :root { … } }`
   を削除し、`color-scheme: light dark` を `light` に変更
2. `src/content/site.ts`: `seo.themeColorDark` を削除
3. `src/components/SEO.astro`: `themeColorDark` の props と、2本立ての
   `theme-color` を単一の `<meta name="theme-color" content={themeColor} />` に
4. `public/_headers` などに記載はなし

#### j. パンくず（表示）

1. `src/components/Breadcrumbs.astro` を削除（`Base.astro` が型
   `BreadcrumbItem` を import しているので、JSON-LD を残すなら型をそちらへ移す）
2. 使っているページがあれば `import Breadcrumbs` と
   `<Breadcrumbs items={crumbs} />` を削除
3. JSON-LD の BreadcrumbList も消すなら、各ページの `const crumbs = […]` と
   `breadcrumbs={crumbs}`、`Base.astro` の `breadcrumbs` prop、
   `jsonld.ts` の `breadcrumbNode` / `hasBreadcrumb` を削除

#### l. JSON-LD 構造化データ

1. `src/lib/seo/` ディレクトリごと削除
2. `src/layouts/Base.astro`: `import { siteGraph }`、`type JsonLd`、
   `const graph = siteGraph({ … })`、Props の `jsonLd`、
   `<SEO … jsonLd={graph} />` の該当行を削除
3. `src/components/SEO.astro`: `type JsonLd`、`jsonLd` prop、
   `const jsonLdArray`、末尾の `jsonLdArray.map( … )` を削除
4. `breadcrumbs={crumbs}` を渡しているページがあれば削除
   （表示用の `<Breadcrumbs items={crumbs} />` は残せる）
5. パンくずの表示も止めるなら §3.2-j へ

> **`src/components/Breadcrumbs.astro` は触る必要がありません。** 型は
> コンポーネント側が持ち、`jsonld.ts` は同じ形を自前で持っているためです
> （§5-1）。`src/lib/noindex.ts` も `lib/seo/` の外なので巻き込まれません。
>
> 検証済み: この手順で `astro check` 0 errors、`ld+json` の出力が消え、
> パンくずの表示は維持。

---

## 4. 消す前のチェック

削除のたびに、CI と同じ検査を通してください。

```bash
pnpm format:check && pnpm check && pnpm test && pnpm build && pnpm check:links
```

拾えるもの / 拾えないものは把握しておくと安全です。

| 検査               | 拾えるもの                                                 | 拾えないもの                   |
| ------------------ | ---------------------------------------------------------- | ------------------------------ |
| `astro check`      | 型エラー、消し忘れた import                                | 出力内容の妥当性               |
| `pnpm test`        | JSON-LD の `@id` 参照、noindex 判定                        | 表示・レイアウト               |
| `pnpm check:links` | HTML 内の死んだ内部リンク、`robots.txt` の `Sitemap:` 参照 | それ以外のファイル、外部リンク |
| `pnpm build`       | 依存の欠落                                                 | 消し漏れた設定値               |

---

## 5. 密結合で消しにくい / 消し漏れやすいもの

ここは「消す必要が出そうなのに素直に消えない」ものだけを挙げます。
影響の大きい順です。

このうち **5-1 / 5-2 / 5-3 / 5-7 は対処済み**です。何をしたか、そして
「なぜ残りは直さないほうがいいか」も併せて書いてあります。

### 5-1. 表示パンくずと JSON-LD の型 ✅ 対処済み

**以前**: `src/components/Breadcrumbs.astro` は見た目のコンポーネントなのに、
型を構造化データのモジュール（`lib/seo/jsonld.ts`）から import していました。
構造化データだけ止めたい（パンくずの表示は残したい）というのは十分ありうる
判断ですが、`src/lib/seo/` を消した瞬間に表示側が型エラーで落ちる状態でした。
しかも `.astro` の型エラーなので `pnpm build` では出ず、`pnpm check` まで
分かりません。

**対処**: 依存の向きを逆転させ、`BreadcrumbItem` は**描画する側**
（`Breadcrumbs.astro`）が `export` するようにしました。`Base.astro` はそこから
import します（`SEO.astro` が `ArticleMeta` を export している既存の形と同じ）。
`jsonld.ts` 側はあえて共有せず、同じ2フィールドを構造型
（`BreadcrumbInput`）として自前で持ちます。**2フィールドの再記述は安く、
レイヤー間の依存は高い**、という判断です。

結果、`src/lib/seo/` への表示側からの依存はゼロになりました。
**検証済み**: `rm -rf src/lib/seo` して `Breadcrumbs.astro` を一切触らずに
`astro check` が 0 errors、パンくずの表示も維持。

> なお、パンくずを使うページは同じ `crumbs` を**表示用**（`<Breadcrumbs items>`）と
> **JSON-LD 用**（`Base` の `breadcrumbs` prop）に二重で渡します。
> ここを Base 側の1本にまとめるとパンくずの配置がレイアウト固定になるため、
> 呼び出しの明示性を優先しました。

### 5-2. サイトマップ削除時の `robots.txt` ✅ 検出可能にした

**以前**: `src/pages/robots.txt.ts` は `sitemap-index.xml` の URL をハードコード
で出力する一方、サイトマップ本体は `astro.config.mjs` の integration が作ります。
両者に参照関係がないため、integration だけ消してもビルドも `astro check` も
`check:links` も通り、**404 を指す `Sitemap:` 行が本番に出ていました**。

**対処**: この結合は消せません（別レイヤーなので、`site.ts` にフラグを置いても
「フラグと integration が一致している保証」が新しい真実の出所になるだけです）。
代わりに `scripts/check-links.mjs` を拡張し、`dist/robots.txt` の `Sitemap:`
URL がビルド出力に存在するかを照合するようにしました。HTML ではないので
本来の走査からは見えない、唯一の「誰も指していない内部参照」だからです。

**検証済み**: sitemap integration だけ消すと
`/robots.txt: dead sitemap reference -> …` で終了コード 1。CI が落ちます。

### 5-3. `noindexPaths` の判定 ✅ 共通化済み

**以前**: 同じ「パス前方一致」の判定が `Base.astro`（meta robots 用）と
`astro.config.mjs`（sitemap の filter 用）に別々に書かれていました。片方だけ
直すと「meta には noindex が出ないのに sitemap からは除外され続ける」という、
どの検査にも引っかからない不整合が残ります。

**対処**: `src/lib/noindex.ts` に `isNoindexPath(path, paths)` を切り出し、
両方がこれを呼ぶようにしました。純関数なので、コンテンツレイヤーより先に
評価される `astro.config.mjs` からでも安全に import できます
。ついでに以前は効かなかった
`"/drafts/"`（末尾スラッシュ付きの記述）も正しくマッチするようになり、
`noindex.test.ts` が両呼び出し元の入力形状を含めて固定しています。

> **`src/lib/seo/` ではなく `src/lib/` 直下に置いてあります。** `lib/seo/` は
> JSON-LD レイヤーで、§3.2-l のとおりディレクトリごと削除できる単位です。
> noindex は構造化データとは無関係なので、その削除に巻き込まれてはいけません。

### 5-4. `theme-color` が3系統に効いている 🟡

`site.ts` の `seo.themeColor` を読んでいる先が3つあります。

| 読み手                                        | 用途                                      |
| --------------------------------------------- | ----------------------------------------- |
| `SEO.astro`                                   | `<meta name="theme-color">`（light/dark） |
| `site.webmanifest.ts`                         | `theme_color` と `background_color`       |
| （`global.css` の `--color-bg` と手動で同期） | 実際の背景色                              |

「ダークモードを消す」「PWA を消す」「theme-color を消す」の3つが同じ設定値を
共有しているため、消す範囲が重なります。特に **PWA を残して theme-color だけ
消す**と `site.webmanifest.ts` が未定義を出力します。

- **回避策**: §3.2-e の手順3
- 3つ目（`--color-bg` との同期）はもともと手動です。ここは自動化されていない
  ことを承知で運用してください

### 5-5. Typography は実質常設 🟡

`about` / `contact` / `legal` / `404` / `index` がすべて
`<article class="prose">` で本文を組んでいます。`@tailwindcss/typography` と
`global.css` の `--tw-prose-*` トークン束ねを消すと、全ページの本文が**素の
HTML の見た目に戻ります**（ビルドもテストも通るので、目で見るまで気づきません）。

Typography ごと外したい場合は、全ページの本文をユーティリティクラスで
組み直すのがセットになります。

### 5-7. `tap-target` の寸法の複製 ✅ 共通化済み

`tap-target` は6ファイル12箇所で使われています。WCAG 2.2 AA（SC 2.5.8）の
要件なので消す想定はありません。

寸法とメディアクエリは `:root` の `--tap-min` の1箇所に集約してあります
（以前はブログのタグ表示用ユーティリティが同じ規則を複製していました）。`@theme` ではなく素の `:root` に置いてあるのは、
`@theme` だと直接使うべきでない Tailwind ユーティリティまで生成されるためです。

### 5-8. `wrangler.jsonc` と `astro.config.mjs` の URL 形状 🟢

`trailingSlash: "never"`（Astro）と `html_handling: "drop-trailing-slash"`
（Cloudflare）はペアです。**どちらか片方だけ変えると `/about` と `/about/` の
両方が 200 を返す重複 URL になります**。これはローカルのビルドでも CI でも
検出できません（配信側の挙動なので）。URL 形状を触るときは必ず両方。
