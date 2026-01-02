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
      },
      animation: {
        // This links to the keyframes below. 
        // 30s is a smooth speed; change to 20s if you want it faster.
        'marquee-fast': 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}