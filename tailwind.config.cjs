/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8f1',
          100: '#ffefdb',
          200: '#ffdab0',
          300: '#ffbf80',
          400: '#ff9b4d',
          500: '#ff7b1a', // Primary Brand Color
          600: '#e65d00',
          700: '#cc4600',
          800: '#a63500', 
          900: '#8c2d00',
        },
        dark: {
          900: '#1a1a1a',
          800: '#2d2d2d',
          700: '#404040',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', '"Noto Sans TC"', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
