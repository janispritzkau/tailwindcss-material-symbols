import css from "./shadow.css?inline";

// The document's stylesheets don't apply inside a shadow root, but its @font-face rules do.
export function mountShadowExample(host: HTMLElement) {
  const root = host.attachShadow({ mode: "open" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  root.adoptedStyleSheets = [sheet];
  root.innerHTML = `
    <p class="flex items-center gap-2">
      <span class="icon icon-symbol-widgets icon-sharp icon-fill icon-lg text-sky-600"></span>
      Rendered in a shadow root
    </p>
  `;
}
