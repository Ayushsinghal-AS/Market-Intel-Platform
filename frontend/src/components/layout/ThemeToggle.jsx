import { useTheme } from "../../contexts/ThemeContext";
import Icon from "../icons/Icon";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 flex items-center justify-center rounded-full text-ink-secondary-light dark:text-ink-secondary-dark hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
    >
      <Icon name={isDark ? "sun" : "moon"} className="w-5 h-5" />
    </button>
  );
}
