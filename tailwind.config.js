/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans KR"', '"Noto Sans KR"', "sans-serif"],
        display: ['"Fraunces"', '"IBM Plex Sans KR"', "serif"],
      },
      boxShadow: {
        soft: "0 24px 60px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
