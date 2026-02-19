/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pricepoint: {
          navy: '#0A1628', // Keep for reference or fallback
          blue: '#0057B8',
          gold: '#B8860B',
          teal: '#00897B',
          slate: '#F8FAFC'
        },
        primary: "#DFA81C", // Gold/Mustard
        "primary-dark": "#b88a14",
        secondary: "#5EC6B3", // Teal
        "background-light": "#E0E5EC",
        "background-dark": "#2D3748",
        "text-light": "#4A5568",
        "text-dark": "#E2E8F0",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: "12px",
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'neu': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
        'neu-dark': '9px 9px 16px rgb(20,20,20,0.6), -9px -9px 16px rgba(60,60,60, 0.3)',
        'neu-pressed': 'inset 6px 6px 10px 0 rgba(163,177,198, 0.7), inset -6px -6px 10px 0 rgba(255,255,255, 0.8)',
        'neu-pressed-dark': 'inset 6px 6px 10px 0 rgba(0,0,0, 0.4), inset -6px -6px 10px 0 rgba(60,60,60, 0.3)',
        'neu-sm': '5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255, 0.5)',
        'neu-sm-dark': '5px 5px 10px rgb(20,20,20,0.6), -5px -5px 10px rgba(60,60,60, 0.3)',
      }
    },
  },
  plugins: [],
}
