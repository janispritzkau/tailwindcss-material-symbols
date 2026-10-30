import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import codepoints from "./generated/codepoints";

/**
 * Tailwind CSS v3 plugin.
 *
 * @deprecated Tailwind CSS v3 support will be removed in the next major version. With Tailwind CSS
 * v4, use `@import "@janispritzkau/tailwindcss-material-symbols";` in your stylesheet instead.
 */
const materialSymbols = plugin(
  ({ addBase, addUtilities, matchUtilities, theme, config }) => {
    // Attribute selector so that Tailwind doesn't treat it as part of the `icon` utility and
    // apply variants to it: `after:icon` would otherwise produce `.after\:icon::after::before`,
    // which is invalid and breaks lightningcss minification.
    addBase({
      [`[class~="${config("prefix") ?? ""}icon"]::before`]: {
        content: "var(--icon-symbol)",
      },
    });

    addUtilities({
      ".icon": {
        boxSizing: "content-box",
        direction: "ltr",
        display: "inline-block",
        fontFamily: theme("icon.font.DEFAULT"),
        fontSize: theme("icon.size.DEFAULT.fontSize"),
        fontStyle: "normal",
        lineHeight: "1",
        textRendering: "optimizeLegibility",
        userSelect: "none",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        "-webkit-font-smoothing": "antialiased",
        fontVariationSettings: [
          `"FILL" var(--icon-fill, ${theme("icon.fill.DEFAULT")})`,
          `"wght" var(--icon-wght, ${theme("icon.wght.DEFAULT")})`,
          `"GRAD" var(--icon-grad, ${theme("icon.grad.DEFAULT")})`,
          `"opsz" var(--icon-opsz, ${theme("icon.size.DEFAULT.opsz")})`,
        ].join(", "),

        "--tw-content": "var(--icon-symbol)", // if applied on before or after variant
      },
    });

    matchUtilities(
      { "icon-symbol": (value) => ({ "--icon-symbol": `"\\${value}"` }) },
      { values: codepoints },
    );

    matchUtilities(
      { icon: (value) => ({ fontFamily: value }) },
      { values: withoutDefault(theme("icon.font")!) },
    );

    matchUtilities(
      { icon: (value) => ({ "--icon-wght": value }) },
      { values: withoutDefault(theme("icon.wght")!) },
    );

    matchUtilities(
      { icon: (value) => ({ "--icon-fill": value }) },
      { values: withoutDefault(theme("icon.fill")!) },
    );

    matchUtilities(
      { icon: (value) => ({ "--icon-grad": value }) },
      { values: withoutDefault(theme("icon.grad")!) },
    );

    matchUtilities(
      {
        // Arbitrary values (`icon-[2em]`) are plain strings and only set the font size.
        icon: (value: string | { fontSize: string; opsz: string }, { modifier }) => ({
          fontSize: typeof value == "string" ? value : value.fontSize,
          ...(modifier != null ? { lineHeight: modifier } : {}),
          ...(typeof value == "string" ? {} : { "--icon-opsz": value.opsz }),
        }),
      },
      {
        type: ["lookup", "number", "length"],
        values: {
          ...withoutDefault(theme("icon.size")!),
          ...Object.fromEntries(
            Object.entries(theme("spacing")!)
              .filter(([key]) => !Number.isNaN(Number(key)))
              .map(([key, val]) => [key, { fontSize: val, opsz: (+key * 4).toString() }]),
          ),
        },
        modifiers: theme("lineHeight"),
      },
    );

    matchUtilities(
      { "icon-opsz": (value) => ({ "--icon-opsz": value.opsz }) },
      { values: withoutDefault(theme("icon.size")!) },
    );
  },
  {
    theme: {
      icon: {
        font: {
          DEFAULT: "'Material Symbols Outlined'",
          outlined: "'Material Symbols Outlined'",
          rounded: "'Material Symbols Rounded'",
          sharp: "'Material Symbols Sharp'",
        },
        size: {
          DEFAULT: { fontSize: defaultTheme.spacing[6], opsz: "24" },
          sm: { fontSize: defaultTheme.spacing[5], opsz: "20" },
          md: { fontSize: defaultTheme.spacing[6], opsz: "24" },
          lg: { fontSize: defaultTheme.spacing[10], opsz: "40" },
          xl: { fontSize: defaultTheme.spacing[12], opsz: "48" },
        },
        wght: {
          DEFAULT: "400",
          thin: "100",
          extralight: "200",
          light: "300",
          normal: "400",
          medium: "500",
          semibold: "600",
          bold: "700",
        },
        fill: {
          DEFAULT: "0",
          fill: "1",
          "no-fill": "0",
        },
        grad: {
          DEFAULT: "0",
          "on-light": "0",
          "on-dark": "-25",
          high: "200",
        },
      },
    },
  },
);

function withoutDefault<T extends Record<string, unknown>>(obj: T): Omit<T, "DEFAULT"> {
  const { DEFAULT: _, ...rest } = obj;
  return rest;
}

export default materialSymbols;
