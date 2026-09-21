import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
