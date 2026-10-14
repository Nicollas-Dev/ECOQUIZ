import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eco: {
          50: "#F8FAF7",
          100: "#EAF3E8",
          200: "#CFE3CE",
          500: "#2F8054",
          700: "#164B35",
          950: "#172923"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 41, 35, 0.08)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
