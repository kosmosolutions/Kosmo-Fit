import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          950: "#06070d",
          900: "#0a0c14",
          850: "#0e111c",
          800: "#131727",
          700: "#1c2236",
          600: "#2a3149",
          500: "#3a4262",
        },
        chalk: {
          50: "#f4f7ff",
          100: "#e6eaf6",
          200: "#c9d0e3",
          300: "#9ba4be",
          400: "#6f7895",
          500: "#4f5777",
        },
        accent: {
          cyan: "#22d3ee",
          violet: "#a78bfa",
          green: "#4ade80",
          rose: "#f87171",
          amber: "#fbbf24",
          sky: "#38bdf8",
          orange: "#fb923c",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,211,238,0.15), 0 8px 30px -10px rgba(34,211,238,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 0 0 1px rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "grid-soft":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
