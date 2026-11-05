import { getCollection } from "astro:content";

export async function getPublishedPosts() {
  const posts = await getCollection("blog", (post) => import.meta.env.DEV || !post.data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
