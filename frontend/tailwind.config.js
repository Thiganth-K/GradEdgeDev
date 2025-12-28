/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          50: '#fff0f2',
          100: '#ffdee2',
          200: '#ffc0c8',
          300: '#ff94a2',
          400: '#ff576e',
          500: '#ff0033', // Brighter Base color
          600: '#db0026',
          700: '#b5001f',
          800: '#96041d',
          900: '#7e081c',
          950: '#45020b',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

