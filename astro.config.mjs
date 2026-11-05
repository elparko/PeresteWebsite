// @ts-check
import { existsSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

// Map each route to the last git commit date of its source file, so the
// sitemap's <lastmod> reflects when a page actually changed — not the build
// time (which would mark every page as "updated" on each deploy and train
// crawlers to ignore the signal). Needs full git history in CI: the deploy
// workflow checks out with fetch-depth: 0 for this reason. Falls back to no
// lastmod when git is unavailable.
const pagesDir = fileURLToPath(new URL("./src/pages", import.meta.url));
const lastmodByPath = {};
for (const file of readdirSync(pagesDir)) {
  if (!file.endsWith(".astro")) continue;
  const route = file === "index.astro" ? "" : `/${file.replace(/\.astro$/, "")}`;
  try {
    const iso = execSync(`git log -1 --format=%cI -- "src/pages/${file}"`, {
      encoding: "utf8",
    }).trim();
    if (iso) lastmodByPath[route] = iso;
  } catch {
    // git missing or file untracked — leave this route without a lastmod.
  }
}

// Blog posts are dated by their Markdown source; the index by its newest post.
const blogDir = fileURLToPath(new URL("./src/content/blog", import.meta.url));
for (const file of existsSync(blogDir) ? readdirSync(blogDir) : []) {
  if (!/\.mdx?$/.test(file)) continue;
  try {
    const iso = execSync(`git log -1 --format=%cI -- "src/content/blog/${file}"`, {
      encoding: "utf8",
    }).trim();
    if (!iso) continue;
    lastmodByPath[`/blog/${file.replace(/\.mdx?$/, "")}`] = iso;
    if (!lastmodByPath["/blog"] || iso > lastmodByPath["/blog"]) lastmodByPath["/blog"] = iso;
  } catch {
    // same fallback as above
  }
}

export default defineConfig({
  site: "https://pereste.com",
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "");
        const lastmod = lastmodByPath[path];
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  // The product was renamed HearthAI → Guide; keep the old URL working.
  redirects: {
    "/hearthai": "/guide",
  },
  build: {
    format: "directory",
  },
});
