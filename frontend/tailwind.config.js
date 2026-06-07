/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: "#151515", 800: "#1e1e1e", 700: "#252525", 600: "#2e2e2e", 500: "#3a3a3a" },
        amber: { DEFAULT: "#F59E0B", light: "#FCD34D", dark: "#D97706" },
        emerald: { DEFAULT: "#10B981", light: "#34D399", dark: "#059669" },
        coral: { DEFAULT: "#FF6B6B", light: "#FF8E8E", dark: "#E55555" },
      },
      fontFamily: {
        display: ["'Clash Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backdropBlur: { xs: "2px" },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 4s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
