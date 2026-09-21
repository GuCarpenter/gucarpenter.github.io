import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { ui } from "../../i18n/ui";
import { postSlug } from "../../i18n/utils";

export async function GET(context) {
  const posts = await getCollection("blog");
  const zhPosts = posts
    .filter((post) => post.data.lang === "zh")
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: ui.zh["site.title"],
    description: ui.zh["site.description"],
    site: context.site,
    items: zhPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/zh/blog/${postSlug(post.id)}/`,
    })),
  });
}
