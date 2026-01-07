# GuCarpenter's Cabin

A personal digital garden and blog built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com).

## 🌟 Features

- **Bilingual Support (EN/ZH)**: Seamless client-side language toggling with persistent preference.
- **Dark Mode**: System-aware dark mode with manual toggle.
- **Math Rendering**: Server-side LaTeX rendering via `rehype-katex` (MathML output).
- **Diagrams**: Mermaid.js support for diagrams and charts.
- **Search**: Client-side full-text search for blog posts.
- **Dynamic Topics**: Automatic categorization and tagging of posts.
- **Pagination**: Client-side pagination for the blog listing.
- **SEO & Sitemap**: Built-in SEO optimizations and automatic sitemap generation.
- **RSS Feed**: Automatic RSS feed generation.

## 🚀 Project Structure

```text
├── public/
├── src/
│   ├── assets/        # Images and static assets
│   ├── components/    # Reusable UI components (Header, Footer, etc.)
│   ├── content/       # Blog posts (Markdown/MDX) organized by category
│   ├── layouts/       # Page layouts (Layout, BlogPost)
│   ├── pages/         # Route definitions (index, blog, about, etc.)
│   ├── styles/        # Global styles and Tailwind configuration
│   └── utils/         # Utility functions (reading time, etc.)
├── astro.config.mjs   # Astro configuration
└── tailwind.config.mjs # Tailwind CSS configuration
```

## 🛠️ Tech Stack

- **Framework**: Astro
- **Styling**: Tailwind CSS
- **Markdown/MDX**: `remark-math`, `rehype-katex`, `rehype-slug`, `rehype-autolink-headings`
- **Search**: Custom client-side search with JSON index
- **Deployment**: GitHub Pages (via GitHub Actions)

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## 📝 License

This project is dual-licensed:
- **Source Code**: [MIT License](./LICENSE)
- **Blog Content**: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)