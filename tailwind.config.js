/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#ff9bb3',
          blue: '#a8d8ff', 
          purple: '#d4a8ff',
          green: '#b3ffcc',
          yellow: '#fff2a8',
        },
        bg: {
          primary: '#fef7ff',
          secondary: '#f0f4ff',
          tertiary: '#fff0f8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(138, 87, 204, 0.08)',
        'hover': '0 8px 32px rgba(138, 87, 204, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}