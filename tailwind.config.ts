import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F97316", // LARANJA
          foreground: "#FFFFFF",
        },
        secondary: "#FB923C",
        background: "#F9FAFB",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        text: {
          DEFAULT: "#111827",
          muted: "#6B7280",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        card: "0 4px 20px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
