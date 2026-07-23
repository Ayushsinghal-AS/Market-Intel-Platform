// Recharts/inline `style=` props need real hex values, not Tailwind classnames,
// so these mirror the tokens in tailwind.config.js and must be kept in sync
// with it by hand.
export const CHART_COLORS = {
  light: { grid: "#e1e0d9", tick: "#898781", blue: "#2a78d6", green: "#008300" },
  dark: { grid: "#1e293b", tick: "#c3c2b7", blue: "#3987e5", green: "#008300" },
};
