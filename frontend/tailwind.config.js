/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15171F",
        slatey: "#5B6173",
        line: "#E6E8EE",
        surface: "#FFFFFF",
        canvas: "#F6F7F9",
        indigo: { DEFAULT: "#4F46E5", soft: "#EEF0FE" },
        good: "#15A34A",
        mid: "#E8930C",
        weak: "#E11D48",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,23,31,0.04), 0 8px 24px rgba(21,23,31,0.06)",
      },
    },
  },
  plugins: [],
};
