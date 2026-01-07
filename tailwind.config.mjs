/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans SC"', "sans-serif"],
      },
      colors: {
        primary: "#0ea5e9", // Sky 500
        secondary: "#38bdf8", // Sky 400
        dark: "#020617", // Slate 950 (Main BG)
        "dark-surface": "#0f172a", // Slate 900 (Cards/Sidebar)
        "dark-border": "#1e293b", // Slate 800 (Borders)
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: theme("colors.slate.600"),
            fontFamily: '"Noto Sans", "Noto Sans SC", sans-serif',
            h2: {
              marginTop: "2em",
              scrollMarginTop: "6rem",
              color: theme("colors.slate.900"),
            },
            h3: {
              marginTop: "1.5em",
              scrollMarginTop: "6rem",
              color: theme("colors.slate.900"),
            },
            a: {
              color: theme("colors.sky.600"),
              textDecoration: "none",
              "&:hover": {
                color: theme("colors.sky.800"),
              },
            },
            code: {
              color: theme("colors.sky.600"),
              backgroundColor: theme("colors.slate.100"),
              padding: "2px 4px",
              borderRadius: "0.25rem",
              fontWeight: "600",
            },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            pre: {
              backgroundColor: "#1e293b",
              color: "#f8fafc",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              boxShadow: theme("boxShadow.md"),
            },
          },
        },
        dark: {
          css: {
            color: theme("colors.slate.300"),
            a: {
              color: theme("colors.sky.400"),
              "&:hover": {
                color: theme("colors.sky.300"),
              },
            },
            h1: { color: theme("colors.slate.100") },
            h2: { color: theme("colors.slate.100") },
            h3: { color: theme("colors.slate.100") },
            strong: { color: theme("colors.slate.100") },
            code: {
              color: theme("colors.sky.300"),
              backgroundColor: "rgba(14, 165, 233, 0.1)",
            },
            pre: {
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
