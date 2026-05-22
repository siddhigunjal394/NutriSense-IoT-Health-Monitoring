/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: '#00d4aa',
        secondary: '#0ea5e9',
        dark: {
          900: '#080c14',
          800: '#0d1321',
          700: '#111827',
          600: '#131d2e',
          500: '#162236',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

