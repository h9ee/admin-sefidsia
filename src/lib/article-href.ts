/**
 * Build the canonical admin URL for an article — uses the article's `url`
 * field (NOT `slug`) so every link in the admin matches what the public
 * client renders. Mirrors `client-sefidsia/src/lib/article-href.ts` so the
 * two surfaces never drift apart.
 *
 * The backend stores `url` in space-separated form (`iphone pro max`); the
 * browser-visible URL replaces spaces with dashes (`iphone-pro-max`).
 */
export function articleHref(article: { url?: string | null }): string {
  return `/articles/${slugifyUrl(article.url ?? "")}`;
}

/**
 * Convert a raw `url` value to its browser representation: trim, lowercase,
 * collapse whitespace/underscores into single hyphens, strip URL-grammar-
 * unsafe characters. Persian/Arabic letters are valid in URLs and pass
 * through unchanged.
 */
export function slugifyUrl(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[?#&%\\/‌]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
