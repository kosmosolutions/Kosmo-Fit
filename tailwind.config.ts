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
        // Everfit-inspired — deep navy ink, cool chalk, electric blue/cyan
        ink: {
          950: "#080b10",
          900: "#0f1419",
          850: "#131923",
          800: "#1a1f2e",
          700: "#232a3d",
          600: "#2f3850",
          500: "#404a66",
        },
        chalk: {
          50: "#f5f7fb",
          100: "#e6eaf2",
          200: "#c7cee0",
          300: "#9aa3bf",
          400: "#6c7795",
          500: "#4d5773",
        },
        accent: {
          // Primary brand accent — electric blue
          blue: "#0066ff",
          // Secondary — bright cyan
          cyan: "#00a8e8",
          // Kept aliases for tonal usage (semantic colors retuned cool)
          lime: "#0066ff", // back-compat alias → resolves to primary blue
          violet: "#7c5cff",
          green: "#22c55e",
          rose: "#f43f5e",
          amber: "#f59e0b",
          sky: "#38bdf8",
          orange: "#fb923c",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,102,255,0.22), 0 8px 30px -10px rgba(0,102,255,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 0 0 1px rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "grid-soft":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
        "brand-gradient":
          "linear-gradient(135deg, #0066ff 0%, #00a8e8 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
