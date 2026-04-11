/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          300: "#fde68a",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        casino: { bg: "#0d0a00", card: "#1a1400", border: "#3d2e00" },
      },
      keyframes: {
        spin3d: {
          "0%": { transform: "rotateX(0deg)" },
          "100%": { transform: "rotateX(360deg)" },
        },
        coinflip: {
          "0%,100%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
        },
        pulse_gold: {
          "0%,100%": { boxShadow: "0 0 8px #f59e0b" },
          "50%": { boxShadow: "0 0 28px #f59e0b, 0 0 60px #f59e0b55" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        slideup: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        reel: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-300%)" },
        },
      },
      animation: {
        spin3d: "spin3d 0.4s linear infinite",
        coinflip: "coinflip 0.5s ease-in-out infinite",
        pulse_gold: "pulse_gold 1.5s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        pop: "pop 0.3s ease-in-out",
        slideup: "slideup 0.35s ease-out",
        reel: "reel 0.15s linear infinite",
      },
    },
  },
  plugins: [],
};
