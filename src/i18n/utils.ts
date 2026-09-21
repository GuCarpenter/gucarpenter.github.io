import { ui, defaultLang } from "./ui";

export type Lang = keyof typeof ui;
export type UIKey = keyof (typeof ui)[typeof defaultLang];

/** Extract the language from a URL pathname (e.g. `/zh/blog/` -> `"zh"`). */
export function getLangFromUrl(url: URL): Lang {
  const [, seg] = url.pathname.split("/");
  if (seg in ui) return seg as Lang;
  return defaultLang;
}

/** Returns a translation function `t(key)` bound to a language. */
export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/**
 * Prefix a root-relative path with the locale segment.
 * The default locale (`en`) is served without a prefix.
 */
export function localizePath(path: string, lang: Lang): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return `/${lang}${clean === "/" ? "" : clean}`;
}

/**
 * Given the current pathname and language, return the equivalent path in the
 * other language. Only handles the locale prefix; page-specific slug mapping
 * (e.g. translated blog posts) should be passed explicitly where needed.
 */
export function getAlternatePath(pathname: string, lang: Lang): string {
  if (lang === defaultLang) {
    return pathname === "/" ? "/zh/" : `/zh${pathname}`;
  }
  const stripped = pathname.replace(/^\/zh(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

/**
 * Build the public URL for a blog post entry, taking the post language into
 * account and stripping the `-zh` id suffix so both languages share a slug.
 */
export function postSlug(id: string): string {
  return id.replace(/-zh$/, "");
}

export function postUrl(id: string, lang: Lang): string {
  return localizePath(`/blog/${postSlug(id)}/`, lang);
}
