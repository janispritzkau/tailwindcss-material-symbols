import plugin from "tailwindcss/plugin";
import codepoints from "./generated/codepoints";

const materialSymbols = plugin(
  ({ addUtilities, matchUtilities, theme }) => {
    addUtilities({
      ".icon, [class^='icon-symbol'], [class*=' icon-symbol']": {
        boxSizing: "content-box",
        direction: "ltr",
        display: "inline-block",
        fontFamily: "var(--icon-font, 'Material Symbols Outlined')",
        fontSize: "calc(var(--icon-opsz, 20) * 1px)",
        fontStyle: "normal",
        lineHeight: "1",
        textRendering: "optimizeLegibility",
        userSelect: "none",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        fontVariationSettings: [
          '"FILL" var(--icon-fill, 0)',
          '"wght" var(--icon-wght, 400)',
          '"GRAD" var(--icon-grad, 0)',
          '"opsz" var(--icon-opsz, 24)',
        ].join(", "),
      },
    });

    matchUtilities({ icon: (value) => ({ "--icon-font": value }) }, { values: theme("icon.font") });
    matchUtilities({ icon: (value) => ({ "--icon-opsz": value }) }, { values: theme("icon.opsz") });
    matchUtilities({ icon: (value) => ({ "--icon-wght": value }) }, { values: theme("icon.wght") });
    matchUtilities({ icon: (value) => ({ "--icon-fill": value }) }, { values: theme("icon.fill") });
    matchUtilities({ icon: (value) => ({ "--icon-grad": value }) }, { values: theme("icon.grad") });

    matchUtilities(
      {
        "icon-symbol": (value) => ({
          "&::before": { content: `"${value}"` },
        }),
      },
      { values: codepoints },
    );
  },
  {
    theme: {
      icon: {
        font: {
          outlined: "'Material Symbols Outlined'",
          rounded: "'Material Symbols Rounded'",
          sharp: "'Material Symbols Sharp'",
        },
        opsz: {
          sm: "20",
          md: "24",
          lg: "40",
          xl: "48",
        },
        wght: {
          thin: "100",
          extralight: "200",
          light: "300",
          normal: "400",
          medium: "500",
          semibold: "600",
          bold: "700",
        },
        fill: {
          fill: "1",
          "no-fill": "0",
        },
        grad: {
          "on-light": "0",
          "on-dark": "-25",
        },
      },
    },
  },
);

export default materialSymbols;
