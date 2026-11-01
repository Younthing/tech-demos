import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "p",
  "br",
  "strong",
  "em",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "b",
  "i",
];

/**
 * Allowlist for `display_data` HTML. sanitize-html parses the fragment, so
 * split tags cannot be rejoined into an iframe or a javascript URL after a
 * string replace. No attributes are kept.
 */
export function sanitizeHtml(input: string): string {
  return sanitize(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: "completelyDiscard",
  });
}
