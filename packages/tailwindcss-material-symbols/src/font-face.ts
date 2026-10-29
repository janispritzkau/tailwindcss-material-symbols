/** Returns an `@font-face` rule for a Material Symbols font. */
export function fontFace(fontFamily: string, url: string): string {
  return `@font-face {
  font-family: "${fontFamily}";
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url("${url}") format("woff2");
}\n`;
}
