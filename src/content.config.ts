import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      lang: z.enum(["en", "zh"]).default("en"),
      tags: z.array(z.string()).optional(),
    }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    // GitHub repository in "owner/name" form; used for the link and star count.
    repo: z.string(),
    url: z.string().url().optional(),
    status: z.enum(["active", "wip", "archived"]).default("active"),
    order: z.number().default(0),
    lang: z.enum(["en", "zh"]).default("en"),
  }),
});

export const collections = { blog, projects };
