# pereste-site

The static site for Pereste Health Inc. at `pereste.com`.

It is built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com) and hosted on GitHub Pages.

---

## What's here

```
.
├── .github/workflows/deploy.yml   GitHub Pages deploy
├── public/                        static files served as they are
│   ├── images/art/                the footer painting
│   ├── logos/                     logos and the Pereste mark
│   └── robots.txt
├── src/
│   ├── components/                Header, Footer, PageOpening, GlyphArt, Placeholder and others
│   ├── content/research/          research posts written in MDX
│   ├── data/                      conditions, research items, posts, social cards
│   ├── layouts/                   Base, Legal, Post
│   ├── pages/                     the pages listed below
│   ├── scripts/glyph/             the glyph art modules
│   └── styles/global.css          Tailwind base and the shared classes
├── astro.config.mjs
└── tailwind.config.ts             brand colors and fonts
```

The site has these pages: `/` (home), `/guide/`, `/research/` and its posts (`/research/medication-neuron-atlas/` with `/research/medication-neuron-atlas/browse/`, `/research/dosegate/`, `/research/advice-vs-education/`), `/about/`, `/careers/`, `/press/`, `/oss/`, `/privacy/` and `/terms/`. `astro.config.mjs` redirects a few old addresses to the current pages.

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in dist/
npm run preview      # serve the build locally
```

The site requires Node 20 or later.

## Deploy

`.github/workflows/deploy.yml` runs on every push to `main`. It builds the site with `withastro/action` and publishes `dist/` to GitHub Pages. The custom domain is set in the repository's Pages settings and in `public/CNAME`. The workflow checks out the full git history so that the sitemap can date each page by its last commit.

## Shared pieces

- The glyph art pieces (the open capsule, the headland and the name field) are JavaScript modules in `src/scripts/glyph/`, and `src/components/GlyphArt.astro` mounts one on a page.
- `src/components/Placeholder.astro` shows an amber marker where a fact is not yet confirmed. Every marker must be replaced or removed before the site goes live.
- The painting at the foot of every page lives in `public/images/art/`, in WebP and JPEG at desktop and phone sizes.

Brand colors and fonts live in `tailwind.config.ts` (`brand.*`), and `src/styles/global.css` applies them. Changing those two files changes the look of every page.

## Content

Page copy lives in the `.astro` files under `src/pages/`. Research posts live in `src/content/research/`, and `src/data/researchItems.ts` lists the published research for the home page and the research index. Patent, funding, IRB (institutional review board) and clinical-trial details stay out of public copy until Parker says otherwise.

## License

Proprietary. Pereste Health Inc., Louisiana, USA.
