const { themeColors } = require("./theme.config");
const plugin = require("tailwindcss/plugin");

const tailwindColors = Object.fromEntries(
  Object.entries(themeColors).map(([name, swatch]) => [
    name,
    {
      DEFAULT: `var(--color-${name})`,
      light: swatch.light,
      dark: swatch.dark,
    },
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
    "./src/**/*.{js,ts,tsx}",
    "./lib/**/*.{js,ts,tsx}",
    "./hooks/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ...tailwindColors,
        canvas: "#FAF8F6",
        paper: "#FFFFFF",
        ink: "#171717",
        muted: "#8B8988",
        line: "#E7E1DE",
        redDeep: "#8F1E2C",
        redSoft: "#FBE8E6",
        peach: "#F4D5CB",
        gold: "#F1B64A",
        goldSoft: "#FFF1D7",
        lavender: "#E8E4F2",
        greenSoft: "#C9E7D2",
        charcoal: "#101112",
        charcoalSoft: "#1B1D1F",
        charcoalLine: "#303336",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ':root:not([data-theme="dark"]) &');
      addVariant("dark", ':root[data-theme="dark"] &');
    }),
  ],
};
