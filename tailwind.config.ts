import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-atkinson)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        palette: {
          ink: "#0D1321",       // Deep Midnight Navy
          prussian: "#1D2D44",  // Prussian Blue Card Surface
          steel: "#3E5C76",     // Paynes Gray / Medium Steel Blue
          shadow: "#748CAB",    // Shadow Slate Blue
          eggshell: "#F0EBD8",  // Warm Alabaster Cream
        },
        wcag: {
          bg: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          text: "var(--text-primary)",
          muted: "var(--text-secondary)",
          border: "var(--border-color)",
          accent: "var(--accent-primary)",
          accentHover: "var(--accent-hover)",
          accentText: "var(--accent-text)",
          success: "#047857",     // Emerald 700 (Contrast >= 5.4:1 with white/eggshell)
          warning: "#B45309",     // Amber 700 (Contrast >= 5.0:1 with white/eggshell)
          danger: "#B91C1C",      // Red 700 (Contrast >= 6.4:1 with white/eggshell)
        },
      },
    },
  },
  plugins: [],
};

export default config;
