/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        waska: '#ea580c', // L'orange du logo Waska Village
      }
    },
  },
  plugins: [],
}