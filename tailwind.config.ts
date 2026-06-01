import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // SF Pro first, fall through to Inter (Google) for non-Apple.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "var(--font-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
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
        tightest: "-0.045em",
        tighter2: "-0.03em",
      },
      colors: {
        // Apple Fitness — OLED black canvas, layered grays for elevation.
        ink: {
          950: "#000000", // pure OLED canvas
          900: "#0a0a0c",
          850: "#1c1c1e", // elevated bento surface
          800: "#2c2c2e", // card / nested surface
          700: "#3a3a3c",
          600: "#48484a",
          500: "#636366",
        },
        chalk: {
          50: "#ffffff",
          100: "#f2f2f7",
          200: "#d1d1d6",
          300: "#aeaeb2",
          400: "#8e8e93", // Apple secondary label
          500: "#636366",
        },
        accent: {
          // Apple Fitness ring + nutrition palette
          rose: "#FF2D55", // Movement / Cardio
          green: "#30D158", // Exercise / Strength
          lime: "#A7FF00", // Alt strength accent
          blue: "#0A84FF", // Stand / Hydration (primary brand)
          cyan: "#64D2FF", // Secondary highlight
          orange: "#FF9F0A", // Diet / Nutrition
          amber: "#FFD60A",
          violet: "#BF5AF2",
          sky: "#5AC8FA",
        },
      },
      borderRadius: {
        // Apple hardware corners
        xl: "12px",
        "2xl": "16px",
        "3xl": "22px",
      },
      boxShadow: {
        // Subtle inner edge + ambient drop for bento depth on OLED.
        glow: "0 0 0 1px rgba(10,132,255,0.30), 0 12px 36px -12px rgba(10,132,255,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06)",
        bento: "0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-soft":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
        "brand-gradient":
          "linear-gradient(135deg, #FF2D55 0%, #FF375F 60%, #FF6482 100%)",
        "ring-move": "linear-gradient(180deg, #FF375F 0%, #FF2D55 100%)",
        "ring-exercise": "linear-gradient(180deg, #A7FF00 0%, #30D158 100%)",
        "ring-stand": "linear-gradient(180deg, #5AC8FA 0%, #0A84FF 100%)",
        "ring-diet": "linear-gradient(180deg, #FFD60A 0%, #FF9F0A 100%)",
      },
      transitionTimingFunction: {
        "ios": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
