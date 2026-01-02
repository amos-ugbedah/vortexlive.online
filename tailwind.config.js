/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#ff3b3b', // Professional Red (Global sports vibe)
        dark: '#0a0a0c',
      }
    },
  },
  plugins: [],
}