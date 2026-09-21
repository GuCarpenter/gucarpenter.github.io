import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";

const posts = await getCollection("blog");

// Map every blog entry (both languages) to its own OG image, keyed by post id.
const pages = Object.fromEntries(posts.map(({ id, data }) => [id, data]));

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_id, page) => ({
    title: page.title,
    description: page.description,
    logo: {
      path: "./src/assets/gu-icon.png",
      size: [72],
    },
    bgGradient: [
      [2, 6, 23],
      [15, 23, 42],
    ],
    border: {
      color: [14, 165, 233],
      width: 24,
      side: "inline-start",
    },
    padding: 60,
    font: {
      title: {
        color: [248, 250, 252],
        size: 64,
        lineHeight: 1.2,
      },
      description: {
        color: [148, 163, 184],
        size: 30,
        lineHeight: 1.4,
      },
    },
    // Single font covering Latin + Simplified Chinese, vendored under /fonts.
    fonts: ["./fonts/NotoSansSC-Bold.otf"],
  }),
});
