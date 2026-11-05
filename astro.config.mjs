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

// Research posts and pages are dated by their source; the index by its newest entry.
const researchDir = fileURLToPath(new URL("./src/content/research", import.meta.url));
const researchFiles = [
  ...(existsSync(researchDir) ? readdirSync(researchDir) : []).map((f) => `src/content/research/${f}`),
  ...readdirSync(`${pagesDir}/research`).map((f) => `src/pages/research/${f}`),
];
for (const source of researchFiles) {
  const file = source.split("/").pop();
  if (!/\.(mdx?|astro)$/.test(file) || file.startsWith("[") || file === "index.astro") continue;
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${source}"`, {
      encoding: "utf8",
    }).trim();
    if (!iso) continue;
    lastmodByPath[`/research/${file.replace(/\.(mdx?|astro)$/, "")}`] = iso;
    if (!lastmodByPath["/research"] || iso > lastmodByPath["/research"]) lastmodByPath["/research"] = iso;
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
    "/blog": "/research",
    "/blog/advice-vs-education": "/research/advice-vs-education",
  },
  build: {
    format: "directory",
  },
});
