// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkModifiedTime } from "./src/utils/remarkModifiedTime.mjs";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://gucarpenter.github.io",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  i18n: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkModifiedTime],
      rehypePlugins: [
        [rehypeKatex, { output: "mathml" }],
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
      ],
    }),
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          zh: "zh",
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
