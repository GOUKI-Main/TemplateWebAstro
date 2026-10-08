// src/content/site.ts
// Single source of truth for site-wide settings. Header, Footer, SEO meta,
// JSON-LD graph, sitemap and the web manifest all read from here. (設定の集約)

export type SiteNavItem = {
  label: string;
  href: string;
};

/** Optional local-business / MEO data. When present, a LocalBusiness JSON-LD
 *  node is emitted and you can surface NAP in the UI. Leave undefined for
 *  non-storefront sites. (§4 MEO) */
export type BusinessConfig = {
  /** schema.org type, e.g. "LocalBusiness", "Restaurant", "Store". */
  type?: string;
  legalName?: string;
  telephone?: string;
  email?: string;
  priceRange?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
  /** Google Maps place URL (MEO). */
  hasMap?: string;
  areaServed?: string[];
  /** e.g. "Mo-Fr 09:00-18:00". */
  openingHours?: string[];
};

export type SiteConfig = {
  /** Absolute production origin, no trailing slash (e.g. "https://example.jp").
   *  Drives canonical URLs, sitemap, robots.txt and JSON-LD via Astro.site. */
  url: string;
  name: string;
  tagline: string;
  description: string;
  locale: string;
  ogLocale: string;
  /** Brand/organization social profiles → Organization.sameAs (§4/§10). */
  sameAs?: string[];
  author: {
    name: string;
    email?: string;
    url?: string;
    socials?: {
      x?: string;
      github?: string;
      linkedin?: string;
    };
  };
  business?: BusinessConfig;
  /** External contact form (Google Forms, Tally, …). Linked from /contact —
   *  no form JS is shipped. Widen form-action / frame-src in public/_headers
   *  if you embed or post to it. */
  contactFormUrl?: string;
  nav: SiteNavItem[];
  /** Secondary links shown in the footer (policy pages and the like). */
  footerNav?: SiteNavItem[];
  seo: {
    ogImage?: string;
    /** Intrinsic size of `ogImage` → og:image:width/height hints. */
    ogImageWidth?: number;
    ogImageHeight?: number;
    /** Site X (Twitter) handle → twitter:site, e.g. "@yourhandle". */
    twitterSite?: string;
    /** Organization / publisher logo (square, ideally >=112px). */
    logo?: string;
    robots: string;
    /** Browser UI color in light mode — keep in sync with --color-bg. */
    themeColor: string;
    /** Browser UI color in dark mode — keep in sync with the dark --color-bg. */
    themeColorDark?: string;
    /** Paths excluded from indexing: drives meta robots AND sitemap. (§1) */
    noindexPaths: string[];
    /** Google Search Console HTML-tag verification code (the `content` value).
     *  Public by design — it is printed into every page. */
    googleSiteVerification?: string;
  };
  /** Cloudflare Web Analytics beacon token. Public by design (it ships to the
   *  browser); the beacon renders only when this is set. */
  cloudflareBeaconToken?: string;
};

// ─────────────────────────────────────────────────────────────────────────
// TEMPLATE: every value below is a placeholder. The setup interview in
// CLAUDE.md (「初期セットアップ」) fills them in; `pnpm check:setup` lists
// every setup marker still left in the repo.
// ─────────────────────────────────────────────────────────────────────────
export const site: SiteConfig = {
  // TODO(setup): Q14 公開するURL（未定の間は example.com のままでよい）
  url: "https://example.com",
  // TODO(setup): Q2 サイト名 / Q3 キャッチコピー・説明文（120字前後）
  name: "サイト名",
  tagline: "ひとことで伝わるキャッチコピー。",
  description:
    "検索結果やSNSでのシェア時に表示される、サイト全体の説明文です。誰に・何を・どこで提供しているかを120字前後で書きます。",
  locale: "ja",
  ogLocale: "ja_JP",
  // TODO(setup): Q8 公式SNSのURL（なければ空配列）
  sameAs: [],
  // TODO(setup): Q4 運営責任者（人の名前）と連絡用メールアドレス
  author: {
    name: "運営者名",
    email: "hello@example.com",
    // url: "https://example.com",
    socials: {
      // x: "https://x.com/yourhandle",
      // github: "https://github.com/yourhandle",
      // linkedin: "https://www.linkedin.com/in/yourhandle/",
    },
  },
  // TODO(setup): Q5 店舗・事務所がある場合だけ設定（住所・電話・営業時間・地図）
  // business: {
  //   type: "LocalBusiness",
  //   legalName: "株式会社〇〇",
  //   telephone: "+81-3-0000-0000",
  //   priceRange: "¥¥",
  //   address: { streetAddress: "1-2-3", addressLocality: "渋谷区", addressRegion: "東京都", postalCode: "150-0001", addressCountry: "JP" },
  //   geo: { latitude: 35.6595, longitude: 139.7005 },
  //   hasMap: "https://maps.google.com/?cid=XXXX",
  //   areaServed: ["東京都"],
  //   openingHours: ["Mo-Fr 09:00-18:00", "Sa 10:00-17:00"],
  // },
  // TODO(setup): Q7 お問い合わせフォームの外部URL（Googleフォーム等。なければ行ごと削除）
  // contactFormUrl: "https://forms.gle/XXXX",
  // TODO(setup): Q6 ページ構成に合わせてナビを並べる（href は末尾スラッシュなし）
  nav: [
    { label: "ホーム", href: "/" },
    { label: "私たちについて", href: "/about" },
    { label: "お問い合わせ", href: "/contact" },
  ],
  footerNav: [{ label: "サイトポリシー", href: "/legal" }],
  seo: {
    ogImage: "/images/og/og-default.jpg",
    ogImageWidth: 1200,
    ogImageHeight: 630,
    // twitterSite: "@yourhandle",
    logo: "/icon-512.png",
    robots:
      "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    // TODO(setup): Q9 配色を決めたら global.css の --color-bg（ライト/ダーク）と揃える
    themeColor: "#fbfbf9",
    themeColorDark: "#14140f",
    noindexPaths: [],
    // 公開後: Search Console の「HTMLタグ」の content の値
    // googleSiteVerification: "XXXXXXXX",
  },
  // 公開後: Cloudflare Web Analytics のトークン（入れるとアクセス解析が有効になる）
  // cloudflareBeaconToken: "XXXXXXXX",
};
