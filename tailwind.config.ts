import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Inter Tight",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      colors: {
        // Athletic Editorial — deep matte ink, warm chalk, electric lime
        ink: {
          950: "#050505",
          900: "#0a0a0a",
          850: "#0f0f10",
          800: "#141416",
          700: "#1c1c20",
          600: "#26262c",
          500: "#34343c",
        },
        chalk: {
          50: "#f7f4ee",
          100: "#ece7dc",
          200: "#cfc8b8",
          300: "#a39d8e",
          400: "#7a7569",
          500: "#5a564d",
        },
        accent: {
          // Primary brand accent
          lime: "#c6ff00",
          // Secondary semantic accents — re-tuned for the editorial palette
          cyan: "#7dd3fc",
          violet: "#c4b5fd",
          green: "#a3e635",
          rose: "#fb7185",
          amber: "#fde047",
          sky: "#bae6fd",
          orange: "#fb923c",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(198,255,0,0.18), 0 8px 30px -10px rgba(198,255,0,0.35)",
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
