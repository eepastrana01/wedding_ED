/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          bg: '#FDFBF7',
          surface: '#FFFFFF',
          card: '#FBF8F2',
          border: '#EBE5D8',
          accent: '#C5A880',
          accentDark: '#A68453',
          accentLight: '#F3ECE1',
          primary: '#1F3A2E',
          primaryLight: '#2D5342',
          primaryDark: '#14271F',
          gold: '#C5A880',
          rose: '#D9777F',
          roseLight: '#FDF2F4',
          sage: '#8FA382',
          sageLight: '#F0F4EE',
          slate: '#334155',
          muted: '#78716C',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 10px 30px -5px rgba(31, 58, 46, 0.07), 0 4px 12px -2px rgba(31, 58, 46, 0.04)',
        'luxury-hover': '0 20px 40px -10px rgba(31, 58, 46, 0.12), 0 8px 16px -4px rgba(31, 58, 46, 0.06)',
        'card': '0 2px 10px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
