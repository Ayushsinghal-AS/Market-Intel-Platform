/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: { light: "#fcfcfb", dark: "#111827" },
        page: { light: "#f9f9f7", dark: "#0b1120" },
        ink: {
          primary: { light: "#0b0b0b", dark: "#ffffff" },
          secondary: { light: "#52514e", dark: "#c3c2b7" },
          muted: "#898781",
        },
        series: {
          blue: { light: "#2a78d6", dark: "#3987e5" },
          green: { light: "#008300", dark: "#008300" },
        },
        status: {
          good: "#10B981",
          warning: "#fab219",
          serious: "#ec835a",
          critical: "#EF4444",
        },
        gridline: { light: "#e1e0d9", dark: "#1e293b" },
        // RGB triplets (not hex) so glass utilities can apply them at partial
        // opacity via bg-[rgba(var(--glass-rgb)/opacity)].
        glass: { light: "255,255,255", dark: "17,24,39" },
      },
    },
  },
  plugins: [],
};
