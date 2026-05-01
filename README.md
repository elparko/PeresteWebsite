# pereste-site

Static landing site for **Pereste LLC** — `pereste.com`.

Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com).
Hosted on **GitLab Pages**.

---

## What's here

```
.
├── DIRECTION.md           — product/company direction (mirror of HearthAI PM brief)
├── public/                — static assets served as-is
│   ├── favicon.svg        — placeholder favicon (replace once brandmark lands)
│   └── logos/             — drop brand guidelines + logos + icons here
├── src/
│   ├── layouts/Base.astro
│   ├── components/        — Header, Footer, Section, Hero, Card, CTA
│   ├── pages/             — index, about, hearthai, careers, press
│   └── styles/global.css  — Tailwind base + brand component classes
├── astro.config.mjs
├── tailwind.config.ts     — brand color tokens (swap when guidelines arrive)
└── .gitlab-ci.yml         — GitLab Pages deploy
```

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output → dist/
npm run preview      # serve the build locally
```

Requires Node 20+.

## Deploy

`.gitlab-ci.yml` runs on every push to the default branch:

1. `npm ci`
2. `npm run build` → `dist/`
3. Rename `dist/` → `public/` (what GitLab Pages serves)

To enable:

1. Push this repo to GitLab.
2. In the project: **Deploy → Pages**. The first successful pipeline
   publishes the site at the GitLab-provided URL.
3. Add `pereste.com` as a custom domain under **Deploy → Pages → New domain**.
   GitLab provides a TXT record for DNS verification — add it at the registrar.
4. Point the apex (and `www` if desired) at GitLab Pages per
   [GitLab's DNS docs](https://docs.gitlab.com/ee/user/project/pages/custom_domains_ssl_tls_certification/).

## Adding brand assets

Drop logo / wordmark / icon SVGs (and any brand-guidelines PDF or MD) into
`public/logos/`. Expected file slugs:

- `logo-mark.svg` — small square mark (used in `Header.astro`)
- `logo-full.svg` — wordmark + mark, primary lockup
- `wordmark.svg` — text wordmark only
- `loader.svg` — loading mark
- `icon-32.png` — fallback raster icon

If files arrive with different names, they'll be renamed in place. Originals
stay alongside as `original-*` for reference.

Brand colors and type live in `tailwind.config.ts` (`brand.*`) and are applied
through `src/styles/global.css`. Updating those two files re-skins the site.

## Content

Page copy lives directly in the `.astro` page files. Iterate copy in-place;
all five pages share the same Header/Footer + Section/Card/Hero/CTA primitives,
so structural changes propagate.

`DIRECTION.md` is a mirror of the HearthAI PM brief — it's the source of
truth for company positioning, audience, and what to (and not to) say
publicly. Patent / funding / IRB / clinical-trial detail stays out of public
copy until Parker says otherwise.

## License / repo

Proprietary. Pereste LLC. Louisiana, USA.
