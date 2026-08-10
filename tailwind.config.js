/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        'brand-dark': '#070b19',
        'brand-card': '#0f1424',
        'brand-primary': '#10b981', // emerald-500
        'brand-secondary': '#14b8a6', // teal-500
        'brand-accent': '#6366f1', // indigo-500
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'sound-wave': 'sound-wave 1.2s ease-in-out infinite',
        'gradient-bg': 'gradient-bg 15s ease infinite',
        'text-shine': 'text-shine 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.4, filter: 'blur(40px)' },
          '50%': { opacity: 0.8, filter: 'blur(60px)' },
        },
        'sound-wave': {
          '0%, 100%': { height: '8px' },
          '50%': { height: '24px' },
        },
        'gradient-bg': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'text-shine': {
          '0%': { 'background-position': '0% center' },
          '100%': { 'background-position': '200% center' },
        }
      }
    },
  },
  plugins: [],
}
