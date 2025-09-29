import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import codepoints from "./generated/codepoints";

const materialSymbols = plugin(
  ({ addUtilities, matchUtilities, theme }) => {
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
        fontVariationSettings: [
          `"FILL" var(--icon-fill, ${theme("icon.fill.DEFAULT")})`,
          `"wght" var(--icon-wght, ${theme("icon.wght.DEFAULT")})`,
          `"GRAD" var(--icon-grad, ${theme("icon.grad.DEFAULT")})`,
          `"opsz" var(--icon-opsz, ${theme("icon.size.DEFAULT.opsz")})`,
        ].join(", "),

        "--tw-content": "var(--icon-symbol)", // if applied on before or after variant

        "&::before": {
          content: "var(--icon-symbol)",
        },
      },
    });

    matchUtilities(
      { "icon-symbol": (value) => ({ "--icon-symbol": `"${value}"` }) },
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
        icon: (value, { modifier }) => ({
          fontSize: value.fontSize,
          ...(modifier != null ? { lineHeight: modifier } : {}),
          "--icon-opsz": value.opsz,
        }),
      },
      {
        type: "length",
        values: withoutDefault(theme("icon.size")!),
        modifiers: theme("lineHeight"),
      },
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
